import { Run, SREDOutput, CandidateProject, BigPictureItem, WorkPerformedItem, IterationItem, DraftingBullet } from "@/types/sred";
import { format } from "date-fns";

// Helper to trigger file download
const downloadFile = (content: string, filename: string, mimeType: string) => {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

// Generate filename base
const getFilenameBase = (run: Run) => {
  const date = format(new Date(run.created_at), 'yyyy-MM-dd');
  const client = run.client_name?.replace(/[^a-zA-Z0-9]/g, '-') || 'unknown';
  return `sred-run-${client}-${date}`;
};

// ============ JSON EXPORT ============
export const exportAsJSON = (run: Run) => {
  const content = JSON.stringify(run, null, 2);
  downloadFile(content, `${getFilenameBase(run)}.json`, 'application/json');
};

export const exportAllAsJSON = (runs: Run[]) => {
  const content = JSON.stringify(runs, null, 2);
  const date = format(new Date(), 'yyyy-MM-dd');
  downloadFile(content, `sred-all-runs-${date}.json`, 'application/json');
};

// ============ CSV EXPORT ============
export const exportAsCSV = (run: Run) => {
  const output = getOutput(run);
  
  // Create a flattened summary CSV
  const rows: string[][] = [];
  
  // Header info
  rows.push(['SR&ED Run Export']);
  rows.push(['']);
  rows.push(['Run ID', run.id]);
  rows.push(['Date', format(new Date(run.created_at), 'yyyy-MM-dd HH:mm')]);
  rows.push(['Client', run.client_name || '']);
  rows.push(['Model', run.model_used]);
  rows.push(['']);
  
  // Candidate Projects
  rows.push(['=== CANDIDATE PROJECTS ===']);
  rows.push(['Label', 'Description', 'Confidence', 'Signals']);
  (output.candidate_projects as CandidateProject[]).forEach(p => {
    rows.push([p.label, p.description, p.confidence, p.signals || '']);
  });
  rows.push(['']);
  
  // Big Picture
  rows.push(['=== BIG PICTURE ===']);
  rows.push(['Type', 'Content', 'Citation Quote', 'Citation Location']);
  (output.big_picture as BigPictureItem[]).forEach(b => {
    const citation = b.citations?.[0];
    rows.push([b.type, b.content, citation?.quote || '', citation?.location || '']);
  });
  rows.push(['']);
  
  // Work Performed
  rows.push(['=== WORK PERFORMED ===']);
  rows.push(['Component', 'Activity', 'Issue Addressed', 'Citation Quote']);
  (output.work_performed as WorkPerformedItem[]).forEach(w => {
    const citation = w.citations?.[0];
    rows.push([w.component, w.activity, w.issue_addressed || '', citation?.quote || '']);
  });
  rows.push(['']);
  
  // Iterations
  rows.push(['=== ITERATIONS ===']);
  rows.push(['Sequence', 'Status', 'Initial Approach', 'Observations', 'Change']);
  (output.iterations as IterationItem[]).forEach(i => {
    rows.push([
      i.sequence_cue || '',
      i.status,
      i.initial_approach,
      i.observations || '',
      i.change || ''
    ]);
  });
  rows.push(['']);
  
  // Drafting Material
  rows.push(['=== DRAFTING MATERIAL ===']);
  rows.push(['Section', 'Bullet', 'Status', 'Clarification Needed', 'Citation']);
  
  const dm = output.drafting_material;
  const addBullets = (section: string, bullets: DraftingBullet[]) => {
    bullets.forEach(b => {
      rows.push([section, b.bullet, b.status, b.clarification_needed || '', b.citation?.quote || '']);
    });
  };
  
  addBullets('Big Picture (232)', dm.big_picture_232 || []);
  addBullets('Work Performed (244/246)', dm.work_performed_244_246 || []);
  addBullets('Iterations', dm.iterations_bullets || []);
  addBullets('Results/Outcomes (248)', dm.results_outcomes_248 || []);
  
  // Convert to CSV string
  const csvContent = rows.map(row => 
    row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')
  ).join('\n');
  
  downloadFile(csvContent, `${getFilenameBase(run)}.csv`, 'text/csv');
};

// ============ HTML EXPORT ============
export const exportAsHTML = (run: Run) => {
  const output = getOutput(run);
  const html = generateHTMLReport(run, output);
  downloadFile(html, `${getFilenameBase(run)}.html`, 'text/html');
};

const getOutput = (run: Run): SREDOutput => ({
  candidate_projects: run.output_candidate_projects || [],
  big_picture: run.output_big_picture || [],
  work_performed: run.output_work_performed || [],
  iterations: run.output_iterations || [],
  drafting_material: run.output_drafting_material || {
    big_picture_232: [],
    work_performed_244_246: [],
    iterations_bullets: [],
    results_outcomes_248: [],
  },
});

const generateHTMLReport = (run: Run, output: SREDOutput): string => {
  const candidateProjects = output.candidate_projects as CandidateProject[];
  const bigPicture = output.big_picture as BigPictureItem[];
  const workPerformed = output.work_performed as WorkPerformedItem[];
  const iterations = output.iterations as IterationItem[];
  const dm = output.drafting_material;
  
  // Count stats
  const allBullets = [
    ...(dm.big_picture_232 || []),
    ...(dm.work_performed_244_246 || []),
    ...(dm.iterations_bullets || []),
    ...(dm.results_outcomes_248 || []),
  ];
  const draftReady = allBullets.filter(b => b.status === 'draft-ready').length;
  const needsClarification = allBullets.filter(b => b.status === 'needs-clarification').length;
  
  // Group big picture by type
  const goals = bigPicture.filter(b => b.type === 'goal');
  const constraints = bigPicture.filter(b => b.type === 'constraint');
  const uncertainties = bigPicture.filter(b => b.type === 'uncertainty');
  
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>SR&ED Run Report - ${run.client_name || 'Unknown Client'}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { 
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      line-height: 1.6;
      color: #1a1a2e;
      background: #f8f9fa;
      padding: 2rem;
    }
    .container { max-width: 900px; margin: 0 auto; }
    
    /* Header */
    .header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 2rem;
      border-radius: 12px;
      margin-bottom: 1.5rem;
    }
    .header h1 { font-size: 1.75rem; margin-bottom: 0.5rem; }
    .header-meta { display: flex; flex-wrap: wrap; gap: 1.5rem; font-size: 0.9rem; opacity: 0.9; }
    .header-meta span { display: flex; align-items: center; gap: 0.5rem; }
    
    /* Summary Box */
    .summary {
      background: white;
      border-radius: 12px;
      padding: 1.5rem;
      margin-bottom: 1.5rem;
      box-shadow: 0 2px 8px rgba(0,0,0,0.08);
    }
    .summary h2 { font-size: 1rem; color: #666; margin-bottom: 1rem; text-transform: uppercase; letter-spacing: 0.5px; }
    .summary-stats {
      display: flex;
      flex-wrap: wrap;
      gap: 1rem;
    }
    .stat {
      background: #f0f4ff;
      padding: 0.75rem 1.25rem;
      border-radius: 8px;
      font-weight: 600;
      color: #4f46e5;
    }
    .stat.success { background: #ecfdf5; color: #059669; }
    .stat.warning { background: #fffbeb; color: #d97706; }
    
    /* Sections */
    .section {
      background: white;
      border-radius: 12px;
      padding: 1.5rem;
      margin-bottom: 1.5rem;
      box-shadow: 0 2px 8px rgba(0,0,0,0.08);
    }
    .section-header {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      margin-bottom: 1rem;
      padding-bottom: 0.75rem;
      border-bottom: 2px solid #f0f0f0;
    }
    .section-header h2 { font-size: 1.25rem; }
    .section-count {
      background: #e0e7ff;
      color: #4338ca;
      padding: 0.25rem 0.75rem;
      border-radius: 100px;
      font-size: 0.85rem;
      font-weight: 600;
    }
    
    /* Cards */
    .card {
      background: #fafafa;
      border: 1px solid #e5e5e5;
      border-radius: 8px;
      padding: 1rem;
      margin-bottom: 0.75rem;
    }
    .card:last-child { margin-bottom: 0; }
    .card-header {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      margin-bottom: 0.5rem;
    }
    .card-title { font-weight: 600; }
    .card-content { color: #444; }
    
    /* Badges */
    .badge {
      display: inline-block;
      padding: 0.2rem 0.6rem;
      border-radius: 100px;
      font-size: 0.75rem;
      font-weight: 600;
      text-transform: uppercase;
    }
    .badge-high, .badge-High { background: #fee2e2; color: #b91c1c; }
    .badge-medium, .badge-Medium { background: #fef3c7; color: #92400e; }
    .badge-low, .badge-Low { background: #dcfce7; color: #166534; }
    .badge-goal { background: #dbeafe; color: #1e40af; }
    .badge-constraint { background: #fef3c7; color: #92400e; }
    .badge-uncertainty { background: #f3e8ff; color: #7c3aed; }
    .badge-complete { background: #dcfce7; color: #166534; }
    .badge-incomplete { background: #fef3c7; color: #92400e; }
    .badge-unresolved { background: #fee2e2; color: #b91c1c; }
    
    /* Drafting Bullets */
    .bullet-item {
      padding: 1rem;
      background: #fafafa;
      border-left: 4px solid #e5e5e5;
      margin-bottom: 0.75rem;
      border-radius: 0 8px 8px 0;
    }
    .bullet-item.draft-ready { border-left-color: #10b981; background: #f0fdf4; }
    .bullet-item.needs-clarification { border-left-color: #f59e0b; background: #fffbeb; }
    .bullet-text { font-size: 1rem; margin-bottom: 0.5rem; }
    .bullet-status {
      display: inline-flex;
      align-items: center;
      gap: 0.25rem;
      font-size: 0.8rem;
      font-weight: 600;
    }
    .bullet-status.ready { color: #059669; }
    .bullet-status.clarify { color: #d97706; }
    .clarification-note {
      margin-top: 0.5rem;
      padding: 0.5rem;
      background: #fef3c7;
      border-radius: 4px;
      font-size: 0.85rem;
      color: #92400e;
    }
    
    /* Citations */
    .citation {
      margin-top: 0.5rem;
      padding: 0.5rem;
      background: #f5f5f5;
      border-radius: 4px;
      font-size: 0.85rem;
      color: #666;
      font-style: italic;
    }
    .citation-location { font-size: 0.75rem; color: #999; margin-top: 0.25rem; font-style: normal; }
    
    /* Subsection */
    .subsection { margin-bottom: 1.5rem; }
    .subsection:last-child { margin-bottom: 0; }
    .subsection-header {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-weight: 600;
      margin-bottom: 0.75rem;
      color: #374151;
    }
    .subsection-icon { font-size: 1.25rem; }
    
    /* Footer */
    .footer {
      text-align: center;
      padding: 1rem;
      color: #999;
      font-size: 0.85rem;
    }
    
    /* Print styles */
    @media print {
      body { background: white; padding: 0; }
      .section { box-shadow: none; border: 1px solid #ddd; }
      .header { background: #333; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    }
  </style>
</head>
<body>
  <div class="container">
    <!-- Header -->
    <div class="header">
      <h1>SR&ED Analysis Report</h1>
      <div class="header-meta">
        <span>📅 ${format(new Date(run.created_at), 'MMMM d, yyyy HH:mm')}</span>
        ${run.client_name ? `<span>👤 ${escapeHtml(run.client_name)}</span>` : ''}
        ${run.fiscal_year ? `<span>📊 FY ${escapeHtml(run.fiscal_year)}</span>` : ''}
        <span>🤖 ${escapeHtml(run.model_used)}</span>
      </div>
    </div>
    
    <!-- Executive Summary -->
    <div class="summary">
      <h2>Executive Summary</h2>
      <div class="summary-stats">
        <div class="stat">${candidateProjects.length} Projects</div>
        <div class="stat">${bigPicture.length} Big Picture</div>
        <div class="stat">${workPerformed.length} Work Items</div>
        <div class="stat">${iterations.length} Iterations</div>
        <div class="stat">${allBullets.length} Drafting Bullets</div>
        <div class="stat success">✓ ${draftReady} Draft-Ready</div>
        ${needsClarification > 0 ? `<div class="stat warning">⚠ ${needsClarification} Need Clarification</div>` : ''}
      </div>
    </div>
    
    <!-- Section 1: Candidate Projects -->
    ${candidateProjects.length > 0 ? `
    <div class="section">
      <div class="section-header">
        <h2>🎯 Candidate Projects</h2>
        <span class="section-count">${candidateProjects.length}</span>
      </div>
      ${candidateProjects.map(p => `
        <div class="card">
          <div class="card-header">
            <span class="card-title">${escapeHtml(p.label)}</span>
            <span class="badge badge-${p.confidence}">${p.confidence}</span>
          </div>
          <div class="card-content">${escapeHtml(p.description)}</div>
          ${p.signals ? `
            <div style="margin-top: 0.5rem; font-size: 0.85rem; color: #666;">
              <strong>Signals:</strong> ${escapeHtml(p.signals)}
            </div>
          ` : ''}
          ${p.citations && p.citations.length > 0 ? `
            <div class="citation">
              "${escapeHtml(p.citations[0].quote)}"
              <div class="citation-location">— ${escapeHtml(p.citations[0].location)}</div>
            </div>
          ` : ''}
        </div>
      `).join('')}
    </div>
    ` : ''}
    
    <!-- Section 2: Big Picture -->
    ${bigPicture.length > 0 ? `
    <div class="section">
      <div class="section-header">
        <h2>🔭 Big Picture</h2>
        <span class="section-count">${bigPicture.length}</span>
      </div>
      
      ${goals.length > 0 ? `
        <div class="subsection">
          <div class="subsection-header"><span class="subsection-icon">🎯</span> Goals (${goals.length})</div>
          ${goals.map(b => `
            <div class="card">
              <div class="card-content">${escapeHtml(b.content)}</div>
              ${b.citations && b.citations.length > 0 ? `<div class="citation">"${escapeHtml(b.citations[0].quote)}"<div class="citation-location">— ${escapeHtml(b.citations[0].location)}</div></div>` : ''}
            </div>
          `).join('')}
        </div>
      ` : ''}
      
      ${constraints.length > 0 ? `
        <div class="subsection">
          <div class="subsection-header"><span class="subsection-icon">🚧</span> Constraints (${constraints.length})</div>
          ${constraints.map(b => `
            <div class="card">
              <div class="card-content">${escapeHtml(b.content)}</div>
              ${b.citations && b.citations.length > 0 ? `<div class="citation">"${escapeHtml(b.citations[0].quote)}"<div class="citation-location">— ${escapeHtml(b.citations[0].location)}</div></div>` : ''}
            </div>
          `).join('')}
        </div>
      ` : ''}
      
      ${uncertainties.length > 0 ? `
        <div class="subsection">
          <div class="subsection-header"><span class="subsection-icon">❓</span> Uncertainties (${uncertainties.length})</div>
          ${uncertainties.map(b => `
            <div class="card">
              <div class="card-content">${escapeHtml(b.content)}</div>
              ${b.citations && b.citations.length > 0 ? `<div class="citation">"${escapeHtml(b.citations[0].quote)}"<div class="citation-location">— ${escapeHtml(b.citations[0].location)}</div></div>` : ''}
            </div>
          `).join('')}
        </div>
      ` : ''}
    </div>
    ` : ''}
    
    <!-- Section 3: Work Performed -->
    ${workPerformed.length > 0 ? `
    <div class="section">
      <div class="section-header">
        <h2>🔧 Work Performed</h2>
        <span class="section-count">${workPerformed.length}</span>
      </div>
      ${workPerformed.map(w => `
        <div class="card">
          <div class="card-header">
            <span class="card-title">${escapeHtml(w.component)}</span>
          </div>
          <div class="card-content">
            <div><strong>Activity:</strong> ${escapeHtml(w.activity)}</div>
            ${w.issue_addressed ? `<div style="margin-top: 0.25rem;"><strong>Issue Addressed:</strong> ${escapeHtml(w.issue_addressed)}</div>` : ''}
          </div>
          ${w.citations && w.citations.length > 0 ? `<div class="citation">"${escapeHtml(w.citations[0].quote)}"<div class="citation-location">— ${escapeHtml(w.citations[0].location)}</div></div>` : ''}
        </div>
      `).join('')}
    </div>
    ` : ''}
    
    <!-- Section 4: Iterations -->
    ${iterations.length > 0 ? `
    <div class="section">
      <div class="section-header">
        <h2>🔄 Iterations</h2>
        <span class="section-count">${iterations.length}</span>
      </div>
      ${iterations.map((i, idx) => `
        <div class="card">
          <div class="card-header">
            <span class="card-title">${i.sequence_cue || `Iteration ${idx + 1}`}</span>
            <span class="badge badge-${i.status}">${i.status}</span>
          </div>
          <div class="card-content">
            <div><strong>Initial Approach:</strong> ${escapeHtml(i.initial_approach)}</div>
            ${i.work_done ? `<div style="margin-top: 0.25rem;"><strong>Work Done:</strong> ${escapeHtml(i.work_done)}</div>` : ''}
            ${i.observations ? `<div style="margin-top: 0.25rem;"><strong>Observations:</strong> ${escapeHtml(i.observations)}</div>` : ''}
            ${i.change ? `<div style="margin-top: 0.25rem;"><strong>Change:</strong> ${escapeHtml(i.change)}</div>` : ''}
          </div>
          ${i.citations && i.citations.length > 0 ? `<div class="citation">"${escapeHtml(i.citations[0].quote)}"<div class="citation-location">— ${escapeHtml(i.citations[0].location)}</div></div>` : ''}
        </div>
      `).join('')}
    </div>
    ` : ''}
    
    <!-- Section 5: Drafting Material -->
    ${allBullets.length > 0 ? `
    <div class="section">
      <div class="section-header">
        <h2>📝 Drafting Material</h2>
        <span class="section-count">${allBullets.length}</span>
      </div>
      
      ${renderBulletSection('Big Picture (Form 232)', dm.big_picture_232 || [])}
      ${renderBulletSection('Work Performed (Form 244/246)', dm.work_performed_244_246 || [])}
      ${renderBulletSection('Iterations', dm.iterations_bullets || [])}
      ${renderBulletSection('Results & Outcomes (Form 248)', dm.results_outcomes_248 || [])}
    </div>
    ` : ''}
    
    <!-- Footer -->
    <div class="footer">
      Generated on ${format(new Date(), 'MMMM d, yyyy HH:mm')} • Run ID: ${run.id}
    </div>
  </div>
</body>
</html>`;
};

const renderBulletSection = (title: string, bullets: DraftingBullet[]): string => {
  if (!bullets || bullets.length === 0) return '';
  
  return `
    <div class="subsection">
      <div class="subsection-header">${title} (${bullets.length})</div>
      ${bullets.map(b => `
        <div class="bullet-item ${b.status}">
          <div class="bullet-text">${escapeHtml(b.bullet)}</div>
          <div class="bullet-status ${b.status === 'draft-ready' ? 'ready' : 'clarify'}">
            ${b.status === 'draft-ready' ? '✓ Draft Ready' : '⚠ Needs Clarification'}
          </div>
          ${b.clarification_needed ? `<div class="clarification-note">💡 ${escapeHtml(b.clarification_needed)}</div>` : ''}
          ${b.citation ? `<div class="citation">"${escapeHtml(b.citation.quote)}"<div class="citation-location">— ${escapeHtml(b.citation.location)}</div></div>` : ''}
        </div>
      `).join('')}
    </div>
  `;
};

const escapeHtml = (text: string): string => {
  if (!text) return '';
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
};
