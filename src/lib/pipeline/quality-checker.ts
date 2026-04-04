import type { Report, ReportContent } from "./reports/types";

export interface QualityIssue {
  reportType: string;
  check: string;
  severity: "error" | "warning";
  message: string;
}

export interface QualityResult {
  passed: boolean;
  score: number; // 0-100
  issues: QualityIssue[];
}

/**
 * Validate a single report against quality criteria:
 * 1. Structural completeness (required fields present)
 * 2. Content quality (minimum length, no empty sections)
 * 3. Beginner-friendliness (Korean text, reasonable length)
 * 4. Data accuracy (data points present where expected)
 */
export function checkReportQuality(report: Report): QualityResult {
  const issues: QualityIssue[] = [];
  let score = 100;

  const c = report.content;

  // 1. Structural completeness
  if (!c.headline || c.headline.length === 0) {
    issues.push({
      reportType: report.reportType,
      check: "headline",
      severity: "error",
      message: "헤드라인이 없습니다",
    });
    score -= 20;
  }

  if (!c.sections || c.sections.length === 0) {
    issues.push({
      reportType: report.reportType,
      check: "sections",
      severity: "error",
      message: "섹션이 없습니다",
    });
    score -= 30;
  }

  if (!c.prediction) {
    issues.push({
      reportType: report.reportType,
      check: "prediction",
      severity: "error",
      message: "예측 정보가 없습니다",
    });
    score -= 15;
  }

  if (!c.keyTakeaways || c.keyTakeaways.length === 0) {
    issues.push({
      reportType: report.reportType,
      check: "keyTakeaways",
      severity: "error",
      message: "핵심 포인트가 없습니다",
    });
    score -= 10;
  }

  // 2. Content quality
  if (c.headline && c.headline.length > 60) {
    issues.push({
      reportType: report.reportType,
      check: "headline_length",
      severity: "warning",
      message: `헤드라인이 너무 깁니다 (${c.headline.length}자, 권장 50자 이내)`,
    });
    score -= 5;
  }

  if (c.sections) {
    for (const section of c.sections) {
      if (!section.body || section.body.length < 50) {
        issues.push({
          reportType: report.reportType,
          check: "section_body",
          severity: "warning",
          message: `"${section.title}" 섹션 본문이 너무 짧습니다 (${section.body?.length || 0}자)`,
        });
        score -= 5;
      }
    }

    if (c.sections.length < 2) {
      issues.push({
        reportType: report.reportType,
        check: "section_count",
        severity: "warning",
        message: "섹션이 2개 미만입니다",
      });
      score -= 5;
    }
  }

  // 3. Beginner-friendliness: check that content contains Korean
  const allText = JSON.stringify(c);
  const koreanChars = (allText.match(/[\uac00-\ud7af]/g) || []).length;
  if (koreanChars < 50) {
    issues.push({
      reportType: report.reportType,
      check: "korean_content",
      severity: "error",
      message: `한글 콘텐츠가 부족합니다 (${koreanChars}자). 초보자 친화적 한국어 콘텐츠가 필요합니다`,
    });
    score -= 20;
  }

  // 4. Data points presence (at least some reports should have data)
  const hasDataPoints = c.sections?.some(
    (s) => s.dataPoints && s.dataPoints.length > 0
  );
  if (!hasDataPoints) {
    issues.push({
      reportType: report.reportType,
      check: "data_points",
      severity: "warning",
      message: "시장 데이터 포인트가 포함되지 않았습니다",
    });
    score -= 5;
  }

  // 5. Prediction validity
  if (c.prediction) {
    if (
      !["up", "down", "sideways"].includes(c.prediction.direction)
    ) {
      issues.push({
        reportType: report.reportType,
        check: "prediction_direction",
        severity: "error",
        message: `잘못된 예측 방향: ${c.prediction.direction}`,
      });
      score -= 10;
    }
    if (!c.prediction.factors || c.prediction.factors.length === 0) {
      issues.push({
        reportType: report.reportType,
        check: "prediction_factors",
        severity: "warning",
        message: "예측 근거가 없습니다",
      });
      score -= 5;
    }
  }

  return {
    passed: score >= 60 && !issues.some((i) => i.severity === "error"),
    score: Math.max(0, score),
    issues,
  };
}

/**
 * Check all reports in a batch.
 * Returns overall pass/fail and per-report results.
 */
export function checkBatchQuality(
  reports: Report[]
): {
  passed: boolean;
  overallScore: number;
  results: Map<string, QualityResult>;
  criticalIssues: QualityIssue[];
} {
  const results = new Map<string, QualityResult>();
  let totalScore = 0;
  const criticalIssues: QualityIssue[] = [];

  for (const report of reports) {
    const result = checkReportQuality(report);
    results.set(report.reportType, result);
    totalScore += result.score;

    if (!result.passed) {
      criticalIssues.push(
        ...result.issues.filter((i) => i.severity === "error")
      );
    }
  }

  const overallScore =
    reports.length > 0 ? Math.round(totalScore / reports.length) : 0;

  return {
    passed: criticalIssues.length === 0 && overallScore >= 60,
    overallScore,
    results,
    criticalIssues,
  };
}
