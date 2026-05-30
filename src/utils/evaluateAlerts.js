// src/utils/evaluateAlerts.js
// Pure client-side function — no API calls.
// Called on Dashboard load with projects, globalSettings, and action items.
// Returns an array of alert objects for the AlertStrip to render.

const ALERT_META = {
  phaseStuck:            { severity: 'alert',   label: 'Phase Stuck'            },
  sopIncomplete:         { severity: 'alert',   label: 'SOP Tasks Overdue'      },
  phaseReady:            { severity: 'alert',   label: 'Ready to Advance'       },
  billingLag:            { severity: 'alert',   label: 'Billing Lag'            },
  openCO:                { severity: 'alert',   label: 'Open Change Orders'     },
  completionApproaching: { severity: 'warning', label: 'Completion Approaching' },
  completionPassed:      { severity: 'warning', label: 'Completion Overdue'     },
  actionItemOverdue:     { severity: 'alert',   label: 'Action Items Past Due'  },
  statusUpdateNeeded:    { severity: 'alert',   label: 'Needs Status Update'    },
}

function daysSince(date) {
  if (!date) return null
  const ms = Date.now() - new Date(date).getTime()
  return Math.floor(ms / (1000 * 60 * 60 * 24))
}

function daysUntil(dateStr) {
  if (!dateStr || dateStr === 'TBD' || dateStr === '') return null
  const dt = new Date(dateStr)
  if (isNaN(dt)) return null
  return Math.floor((dt.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
}

function mergeSettings(global = {}, overrides = {}) {
  return {
    phaseStuckDays:        overrides?.phaseStuckDays        ?? global.phaseStuckDays        ?? 5,
    sopIncompleteDays:     overrides?.sopIncompleteDays     ?? global.sopIncompleteDays     ?? 10,
    billingLagDays:        overrides?.billingLagDays        ?? global.billingLagDays        ?? 7,
    openCODays:            overrides?.openCODays            ?? global.openCODays            ?? 5,
    completionWarningDays: overrides?.completionWarningDays ?? global.completionWarningDays ?? 14,
    statusUpdateDays:      overrides?.statusUpdateDays      ?? global.statusUpdateDays      ?? 7,
  }
}

function isVisible(project, alertType, now = new Date()) {
  // Check permanently dismissed
  if (project.dismissedAlerts?.some(d => d.alertType === alertType)) return false
  // Check snoozed
  if (project.snoozedAlerts?.some(s => s.alertType === alertType && new Date(s.snoozeUntil) > now)) return false
  return true
}

export function evaluateAlerts(projects = [], globalSettings = {}, actionItemsByProjectId = {}) {
  const alerts = []
  const now    = new Date()

  for (const project of projects) {
    const settings  = mergeSettings(globalSettings, project.alertOverrides)
    const projectId = project._id

    const push = (type, message) => {
      if (!isVisible(project, type, now)) return
      alerts.push({
        projectId,
        projectName:   project.name   || '',
        projectNumber: project.number || '',
        type,
        severity: ALERT_META[type]?.severity || 'alert',
        label:    ALERT_META[type]?.label    || type,
        message,
      })
    }

    // Live days in current phase — computed from phaseStartDate (falls back to daysInPhase for legacy projects)
    const daysInPhase = project.phaseStartDate
      ? Math.floor((now.getTime() - new Date(project.phaseStartDate).getTime()) / (1000 * 60 * 60 * 24))
      : (project.daysInPhase || 0)

    // ── #1  Phase stuck ──────────────────────────────────────────────────────
    if (daysInPhase > settings.phaseStuckDays) {
      push('phaseStuck',
        `In Phase ${project.phase} for ${daysInPhase} day${daysInPhase !== 1 ? 's' : ''} (threshold: ${settings.phaseStuckDays})`)
    }

    // ── #2  Required SOP tasks incomplete ───────────────────────────────────
    if (daysInPhase > settings.sopIncompleteDays && (project.sopComplete || 0) < 100) {
      push('sopIncomplete',
        `Phase ${project.phase} SOP tasks incomplete after ${daysInPhase} day${daysInPhase !== 1 ? 's' : ''} (threshold: ${settings.sopIncompleteDays})`)
    }

    // ── #3  Phase ready — immediate ──────────────────────────────────────────
    if (project.phaseReady && project.phase < 9) {
      push('phaseReady',
        `All required tasks complete — ready to advance from Phase ${project.phase} to ${project.phase + 1}`)
    }

    // ── #4/#5  Billing lag (Phase 5+ only) ──────────────────────────────────
    if (project.phase >= 5) {
      const billingDays = daysSince(project.lastBillingUpdate || project.createdAt)
      if (billingDays !== null && billingDays > settings.billingLagDays) {
        push('billingLag',
          `Billing hasn't been updated in ${billingDays} days (threshold: ${settings.billingLagDays})`)
      }
    }

    // ── #6  Open change orders ───────────────────────────────────────────────
    if ((project.openCOs || 0) > 0) {
      const coDays = daysSince(project.lastCOUpdate || project.createdAt)
      if (coDays !== null && coDays > settings.openCODays) {
        push('openCO',
          `${project.openCOs} open change order${project.openCOs !== 1 ? 's' : ''} unresolved for ${coDays} days (threshold: ${settings.openCODays})`)
      }
    }

    // ── #7  Completion approaching (warning) ─────────────────────────────────
    const daysToCompletion = daysUntil(project.completionDate)
    if (daysToCompletion !== null && daysToCompletion >= 0 && daysToCompletion <= settings.completionWarningDays) {
      push('completionApproaching',
        `Completion date in ${daysToCompletion} day${daysToCompletion !== 1 ? 's' : ''}`)
    }

    // ── #8  Completion date passed (warning) ─────────────────────────────────
    if (daysToCompletion !== null && daysToCompletion < 0 && project.phase < 9) {
      push('completionPassed',
        `Completion date passed ${Math.abs(daysToCompletion)} day${Math.abs(daysToCompletion) !== 1 ? 's' : ''} ago`)
    }

    // ── #10  Action items overdue — immediate ────────────────────────────────
    const projectActionItems = actionItemsByProjectId[projectId] || []
    const overdueCount = projectActionItems.filter(i =>
      i.dueDate &&
      new Date(i.dueDate) < now &&
      i.status !== 'Resolved' &&
      i.status !== 'Closed'
    ).length
    if (overdueCount > 0) {
      push('actionItemOverdue',
        `${overdueCount} action item${overdueCount !== 1 ? 's' : ''} past due date`)
    }

    // ── #11  Status update needed ────────────────────────────────────────────
    const statusDays = daysSince(project.lastStatusUpdate || project.createdAt)
    if (statusDays !== null && statusDays > settings.statusUpdateDays) {
      push('statusUpdateNeeded',
        `No status update in ${statusDays} days — PM update required (threshold: ${settings.statusUpdateDays})`)
    }
  }

  return alerts
}

export { ALERT_META }
