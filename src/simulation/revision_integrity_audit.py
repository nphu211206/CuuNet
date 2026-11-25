"""Audit manuscript, repository, and experiment consistency for HYDRO-D-26-00188.

The audit uses only the Python standard library so it can run before scientific
dependencies are installed. It does not modify submission files.
"""

from __future__ import annotations

import argparse
import csv
import json
import re
import sys
import zipfile
from dataclasses import asdict, dataclass
from pathlib import Path
from typing import Iterable
from xml.etree import ElementTree as ET


WORD_NS = "http://schemas.openxmlformats.org/wordprocessingml/2006/main"
DRAWING_NS = "http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing"
NS = {"w": WORD_NS, "wp": DRAWING_NS}


@dataclass
class Finding:
    severity: str
    code: str
    message: str
    evidence: str


def read_docx_xml(path: Path) -> ET.Element:
    with zipfile.ZipFile(path) as archive:
        return ET.fromstring(archive.read("word/document.xml"))


def docx_text(path: Path, include_deleted: bool = True) -> str:
    root = read_docx_xml(path)
    output: list[str] = []
    accepted_names = {f"{{{WORD_NS}}}t"}
    if include_deleted:
        accepted_names.add(f"{{{WORD_NS}}}delText")
    for paragraph in root.findall(".//w:body//w:p", NS):
        parts: list[str] = []
        for node in paragraph.iter():
            if node.tag in accepted_names and node.text:
                parts.append(node.text)
            elif node.tag == f"{{{WORD_NS}}}tab":
                parts.append("\t")
            elif node.tag == f"{{{WORD_NS}}}br":
                parts.append(" ")
        text = "".join(parts).strip()
        if text:
            output.append(text)
    return "\n".join(output)


def docx_stats(path: Path) -> dict[str, int]:
    root = read_docx_xml(path)
    alt_descriptions = 0
    for node in root.findall(".//wp:docPr", NS):
        if node.attrib.get("descr", "").strip():
            alt_descriptions += 1
    return {
        "insertions": len(root.findall(".//w:ins", NS)),
        "deletions": len(root.findall(".//w:del", NS)),
        "comments": len(root.findall(".//w:commentRangeStart", NS)),
        "drawings": len(root.findall(".//w:drawing", NS)),
        "alt_descriptions": alt_descriptions,
    }


def add_if_contains(
    findings: list[Finding],
    text: str,
    needle: str,
    severity: str,
    code: str,
    message: str,
) -> None:
    if needle.lower() in text.lower():
        findings.append(Finding(severity, code, message, needle))


def read_csv_rows(path: Path) -> list[dict[str, str]]:
    with path.open("r", encoding="utf-8-sig", newline="") as handle:
        return list(csv.DictReader(handle))


def extract_notebook_source(path: Path) -> str:
    notebook = json.loads(path.read_text(encoding="utf-8"))
    sources: list[str] = []
    for cell in notebook.get("cells", []):
        if cell.get("cell_type") == "code":
            sources.append("".join(cell.get("source", [])))
    return "\n".join(sources)


def load_simple_yaml_values(path: Path) -> dict[str, object]:
    values: dict[str, object] = {}
    for raw_line in path.read_text(encoding="utf-8").splitlines():
        line = raw_line.split("#", 1)[0].rstrip()
        if not line or ":" not in line:
            continue
        key, value = line.strip().split(":", 1)
        value = value.strip()
        if not value:
            continue
        if value.startswith("[") and value.endswith("]"):
            try:
                values[key] = json.loads(value.replace("'", '"'))
            except json.JSONDecodeError:
                values[key] = value
        elif re.fullmatch(r"-?\d+", value):
            values[key] = int(value)
        elif re.fullmatch(r"-?\d+(?:\.\d+)?", value):
            values[key] = float(value)
        else:
            values[key] = value.strip('"')
    return values


def audit(root: Path) -> tuple[list[Finding], dict[str, object]]:
    findings: list[Finding] = []
    submission = root / "paper_submission"
    clean_path = submission / "HYDRO_D_26_00188_Revision1_Clean.docx"
    tracked_path = submission / "HYDRO_D_26_00188_TrackedChanges.docx"
    response_path = submission / "HYDRO_D_26_00188_Response_to_Reviewers.docx"
    alt_path = submission / "HYDRO_D_26_00188_AltText.docx"

    required = [clean_path, tracked_path, response_path, alt_path]
    missing = [str(path) for path in required if not path.exists()]
    if missing:
        for path in missing:
            findings.append(Finding("critical", "FILE_MISSING", "Required submission file is missing.", path))
        return findings, {"missing_files": missing}

    clean = docx_text(clean_path, include_deleted=False)
    response = docx_text(response_path, include_deleted=False)
    alt = docx_text(alt_path, include_deleted=False)
    stats = {
        "clean": docx_stats(clean_path),
        "tracked": docx_stats(tracked_path),
        "response": docx_stats(response_path),
        "alt": docx_stats(alt_path),
    }

    if stats["clean"]["insertions"] or stats["clean"]["deletions"]:
        findings.append(Finding("critical", "CLEAN_HAS_REVISIONS", "Clean manuscript contains tracked revisions.", json.dumps(stats["clean"])))
    if not stats["tracked"]["insertions"] and not stats["tracked"]["deletions"]:
        findings.append(Finding("high", "TRACKED_EMPTY", "Tracked manuscript contains no tracked revisions.", json.dumps(stats["tracked"])))
    if stats["clean"]["drawings"] != stats["clean"]["alt_descriptions"]:
        findings.append(
            Finding(
                "high",
                "EMBEDDED_ALT_MISSING",
                "Not every embedded drawing has a non-empty OOXML alt description.",
                json.dumps(stats["clean"]),
            )
        )

    add_if_contains(
        findings,
        clean,
        "Seasonal Decomposition achieves the lowest Average MAE (0.1641)",
        "critical",
        "TABLE5_AVERAGE_RANK",
        "The manuscript calls Seasonal Decomposition the best average-MAE model although Table 5 reports TA-LSTM MAE 0.1280.",
    )
    add_if_contains(
        findings,
        clean,
        "TA-LSTM achieves the overall lowest Peak Event MAE of 0.3037",
        "critical",
        "TABLE5_PEAK_RANK",
        "The manuscript calls TA-LSTM the best peak-error model although the ensemble is reported as 0.1395.",
    )
    add_if_contains(
        findings,
        clean,
        "57.8% reduction",
        "critical",
        "PEAK_REDUCTION_ARITHMETIC",
        "The claimed 57.8 percent peak reduction is incompatible with the reported 0.3037 and 0.3047 values.",
    )
    add_if_contains(
        findings,
        clean,
        "Peak Event MAE degrades from 0.3037",
        "critical",
        "ATTENTION_ABLATION_DIRECTION",
        "The attention ablation describes a lower MAE as degradation.",
    )
    add_if_contains(
        findings,
        clean,
        "from 0.1804 for FP32 to 0.1280 for INT8, a +0.44% degradation",
        "critical",
        "QUANTISATION_ARITHMETIC",
        "The quantisation paragraph describes a large decrease in MAE as a 0.44 percent degradation.",
    )
    add_if_contains(
        findings,
        clean,
        "forced using a high-resolution simulation dataset corresponding to Super Typhoon Yagi",
        "critical",
        "YAGI_DATA_UNSUPPORTED",
        "The current training notebook contains no 2024 Yagi input dataset.",
    )
    add_if_contains(
        findings,
        clean,
        "The TA-LSTM model is trained on historical climate data for Vietnam",
        "critical",
        "HISTORICAL_DATA_UNSUPPORTED",
        "The current notebook generates synthetic monthly series rather than loading historical climate files.",
    )
    for value in ("31.3 mW", "4.45 mJ", "0.000025%"):
        add_if_contains(
            findings,
            clean,
            value,
            "high",
            "ENERGY_VALUE_UNVERIFIED",
            "The clean manuscript retains an unverified theoretical energy figure that the response says was removed.",
        )

    add_if_contains(
        findings,
        response,
        "789, 1011",
        "high",
        "SEED_MISMATCH_RESPONSE",
        "The response lists seed 1011 while the repository uses seed 2024.",
    )
    add_if_contains(
        findings,
        response,
        "patience of 15 epochs",
        "high",
        "PATIENCE_MISMATCH_RESPONSE",
        "The response lists early-stopping patience 15 while the repository uses 20.",
    )
    add_if_contains(
        findings,
        response,
        "Adopted Option (b) completely and comprehensively",
        "high",
        "REVIEWER_OPTION_CONFLATION",
        "Reviewer 1 option b required external validation; claim narrowing was Reviewer 2 M1 option b.",
    )
    add_if_contains(
        findings,
        response,
        "all 42 remaining references",
        "medium",
        "REFERENCE_ABSOLUTE_CLAIM",
        "The response makes an absolute verification claim that must be supported by an external bibliography audit.",
    )

    add_if_contains(
        findings,
        alt,
        "two stacked Temporal Attention LSTM Cells",
        "high",
        "ALT_ARCHITECTURE_MISMATCH",
        "Alt text describes two stacked recurrent layers while the notebook implements one LSTM layer.",
    )
    add_if_contains(
        findings,
        alt,
        "12-Month Risk Trajectory",
        "high",
        "ALT_OUTPUT_MISMATCH",
        "Alt text describes a 12-step model output while the trained model has a scalar one-step output.",
    )

    notebook_path = root / "notebooks" / "ta_lstm_training.ipynb"
    notebook_source = extract_notebook_source(notebook_path)
    if "annual_severity" in notebook_source and "np.random.normal" in notebook_source:
        findings.append(
            Finding(
                "critical",
                "SYNTHETIC_DATA_GENERATOR",
                "Training data are generated from hard-coded annual severity arrays, a seasonal kernel and random noise.",
                "notebooks/ta_lstm_training.ipynb",
            )
        )
    if "pd.read_csv" not in notebook_source:
        findings.append(
            Finding(
                "critical",
                "NO_EXTERNAL_TRAINING_INPUT",
                "The training notebook does not load an external observational or reanalysis dataset.",
                "notebooks/ta_lstm_training.ipynb",
            )
        )
    if "FEAT_COLS = ['S_raw', 'H', 'E', 'V', 'month_sin', 'month_cos']" in notebook_source:
        findings.append(
            Finding(
                "high",
                "FEATURE_DESCRIPTION_MISMATCH",
                "Notebook features differ from the meteorological and terrain variables described in the manuscript.",
                "S_raw,H,E,V,month_sin,month_cos",
            )
        )

    config_path = root / "src" / "simulation" / "model_config.yaml"
    config = load_simple_yaml_values(config_path)
    training_log_path = root / "data" / "training_log.json"
    training_log = json.loads(training_log_path.read_text(encoding="utf-8"))
    seeds = training_log.get("seeds_used", [])
    patience = training_log.get("model", {}).get("early_stopping_patience")
    if seeds != [42, 123, 456, 789, 2024]:
        findings.append(Finding("high", "TRAINING_LOG_SEEDS", "Training log seed set differs from the expected repository configuration.", json.dumps(seeds)))
    if patience != 20:
        findings.append(Finding("high", "TRAINING_LOG_PATIENCE", "Training log patience differs from the notebook configuration.", str(patience)))
    if config.get("seeds") != seeds:
        findings.append(Finding("high", "YAML_LOG_SEED_MISMATCH", "YAML and training log seed sets differ.", f"yaml={config.get('seeds')} log={seeds}"))

    sybil_rows = read_csv_rows(root / "data" / "dst_sybil_defense_results.csv")
    if len(sybil_rows) <= 2:
        findings.append(
            Finding(
                "high",
                "SYBIL_RESULTS_INCOMPLETE",
                "Public Sybil CSV contains only the obsolete illustrative scenarios rather than full stress-test outputs.",
                f"rows={len(sybil_rows)}",
            )
        )

    readme = (root / "data" / "README.md").read_text(encoding="utf-8")
    for missing_name in ("adversarial_r2_tests.py", "audit_reviewer2_r2.py"):
        if missing_name in readme and not (root / "src" / "simulation" / missing_name).exists():
            findings.append(Finding("high", "README_MISSING_SCRIPT", "Data README lists a script that is absent from the repository.", missing_name))
    if "planned IndexedDB migration" in readme:
        findings.append(Finding("medium", "README_INDEXEDDB_STALE", "Repository documentation is stale relative to the implemented IndexedDB queue.", "data/README.md"))

    report = {
        "submission_stats": stats,
        "repository": {
            "training_seeds": seeds,
            "early_stopping_patience": patience,
            "model_features": training_log.get("model", {}).get("feature_names", []),
            "sybil_public_rows": len(sybil_rows),
        },
        "finding_counts": {
            severity: sum(1 for finding in findings if finding.severity == severity)
            for severity in ("critical", "high", "medium", "low")
        },
    }
    return findings, report


def write_markdown(path: Path, findings: Iterable[Finding], report: dict[str, object]) -> None:
    findings = list(findings)
    lines = [
        "# Generated Revision Integrity Audit",
        "",
        "This report is generated by `src/simulation/revision_integrity_audit.py`.",
        "",
        "## Summary",
        "",
        f"- Critical findings: {report['finding_counts']['critical']}",
        f"- High findings: {report['finding_counts']['high']}",
        f"- Medium findings: {report['finding_counts']['medium']}",
        f"- Low findings: {report['finding_counts']['low']}",
        "",
        "## Findings",
        "",
    ]
    for finding in findings:
        lines.extend(
            [
                f"### {finding.severity.upper()} {finding.code}",
                "",
                finding.message,
                "",
                f"Evidence: `{finding.evidence}`",
                "",
            ]
        )
    path.write_text("\n".join(lines), encoding="utf-8")


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--root", type=Path, default=Path(__file__).resolve().parents[2])
    parser.add_argument("--json", type=Path, default=Path("analysis/generated_integrity_audit.json"))
    parser.add_argument("--markdown", type=Path, default=Path("analysis/generated_integrity_audit.md"))
    parser.add_argument("--fail-on", choices=("critical", "high", "never"), default="critical")
    args = parser.parse_args()

    root = args.root.resolve()
    findings, report = audit(root)
    json_path = args.json if args.json.is_absolute() else root / args.json
    markdown_path = args.markdown if args.markdown.is_absolute() else root / args.markdown
    json_path.parent.mkdir(parents=True, exist_ok=True)
    markdown_path.parent.mkdir(parents=True, exist_ok=True)
    json_path.write_text(
        json.dumps({"report": report, "findings": [asdict(finding) for finding in findings]}, indent=2, ensure_ascii=False),
        encoding="utf-8",
    )
    write_markdown(markdown_path, findings, report)

    for finding in findings:
        print(f"[{finding.severity.upper()}] {finding.code}: {finding.message}")
    print(json.dumps(report["finding_counts"], indent=2))

    if args.fail_on == "never":
        return 0
    if args.fail_on == "critical" and any(finding.severity == "critical" for finding in findings):
        return 2
    if args.fail_on == "high" and any(finding.severity in {"critical", "high"} for finding in findings):
        return 2
    return 0


if __name__ == "__main__":
    sys.exit(main())
