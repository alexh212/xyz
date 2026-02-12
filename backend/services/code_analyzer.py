from typing import Dict, List


def parse_unified_diff(diff_text: str) -> List[Dict[str, str]]:
    """Parse a unified diff into per-file chunks for downstream analysis."""
    files: List[Dict[str, str]] = []

    current_file = None
    current_lines: List[str] = []

    for line in diff_text.splitlines():
        if line.startswith("diff --git "):
            if current_file:
                current_file["patch"] = "\n".join(current_lines).strip()
                files.append(current_file)

            parts = line.split(" ")
            old_path = parts[2][2:] if len(parts) > 2 and parts[2].startswith("a/") else ""
            new_path = parts[3][2:] if len(parts) > 3 and parts[3].startswith("b/") else ""
            current_file = {
                "old_path": old_path,
                "new_path": new_path,
                "patch": "",
            }
            current_lines = [line]
        elif current_file:
            current_lines.append(line)

    if current_file:
        current_file["patch"] = "\n".join(current_lines).strip()
        files.append(current_file)

    return files


def summarize_diff(files: List[Dict[str, str]]) -> Dict[str, int]:
    additions = 0
    deletions = 0

    for file_info in files:
        for line in file_info.get("patch", "").splitlines():
            if line.startswith("+++") or line.startswith("---"):
                continue
            if line.startswith("+"):
                additions += 1
            elif line.startswith("-"):
                deletions += 1

    return {
        "files_changed": len(files),
        "additions": additions,
        "deletions": deletions,
    }
