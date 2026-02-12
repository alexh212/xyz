from flask import Blueprint, jsonify, request

from config import Config
from extensions import limiter
from models.review_result import Finding, ReviewResult
from services.code_analyzer import parse_unified_diff, summarize_diff
from services.openai_service import OpenAIService, OpenAIServiceError

review_bp = Blueprint("review", __name__)
openai_service = OpenAIService()

def _parse_findings(items):
    findings = []
    for item in items:
        if not isinstance(item, dict):
            continue
        findings.append(
            Finding(
                title=item.get("title", "Untitled finding"),
                description=item.get("description", "No description provided."),
                severity=item.get("severity", "medium"),
                file_path=item.get("file_path", ""),
                line=item.get("line"),
                suggestion=item.get("suggestion", ""),
            )
        )
    return findings


@review_bp.route("/api/review", methods=["POST"])
@limiter.limit(Config.RATE_LIMIT_REVIEW)
def review_pull_request():
    payload = request.get_json(silent=True) or {}
    diff_text = payload.get("diff", "")

    if not isinstance(diff_text, str) or not diff_text.strip():
        return jsonify({"error": "`diff` field is required and must be a non-empty string"}), 400

    if len(diff_text) > Config.MAX_DIFF_CHARS:
        return jsonify(
            {
                "error": "Diff payload too large",
                "max_diff_chars": Config.MAX_DIFF_CHARS,
            }
        ), 413

    parsed_files = parse_unified_diff(diff_text)
    diff_summary = summarize_diff(parsed_files)

    if not parsed_files:
        empty = ReviewResult(
            summary="No parseable file changes were found in the submitted diff.",
            security=[],
            performance=[],
            code_quality=[],
            best_practices=[],
        )
        return jsonify({"review": empty.to_dict(), "meta": diff_summary}), 200

    try:
        ai_result = openai_service.analyze_pull_request(parsed_files, diff_summary)
    except OpenAIServiceError as exc:
        return jsonify({"error": "AI analysis failed", "details": str(exc)}), 502
    except Exception:
        return jsonify({"error": "Unexpected server error during analysis"}), 500

    review = ReviewResult(
        summary=ai_result.get("summary", "AI review completed."),
        security=_parse_findings(ai_result.get("security", [])),
        performance=_parse_findings(ai_result.get("performance", [])),
        code_quality=_parse_findings(ai_result.get("code_quality", [])),
        best_practices=_parse_findings(ai_result.get("best_practices", [])),
    )

    return jsonify({"review": review.to_dict(), "meta": diff_summary}), 200
