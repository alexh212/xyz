from dataclasses import asdict, dataclass, field
from typing import Dict, List, Optional


@dataclass
class Finding:
    title: str
    description: str
    severity: str = "medium"
    file_path: str = ""
    line: Optional[int] = None
    suggestion: str = ""


@dataclass
class ReviewResult:
    summary: str
    security: List[Finding] = field(default_factory=list)
    performance: List[Finding] = field(default_factory=list)
    code_quality: List[Finding] = field(default_factory=list)
    best_practices: List[Finding] = field(default_factory=list)

    def to_dict(self) -> Dict:
        return {
            "summary": self.summary,
            "security": [asdict(item) for item in self.security],
            "performance": [asdict(item) for item in self.performance],
            "code_quality": [asdict(item) for item in self.code_quality],
            "best_practices": [asdict(item) for item in self.best_practices],
        }
