
import os
css_path = 'style-new.css'
with open(css_path, 'a', encoding='utf-8') as f:
    f.write("""
/* Disease Integration Summary & Unified AI Summary */
.disease-integration-card {
  border: 4px solid #ef4444 !important;
  background: #fff5f5 !important;
  box-shadow: 8px 8px 0px #ef4444 !important;
  padding: 24px !important;
  margin-bottom: 32px !important;
}

.unified-summary {
  background: #faf5ff !important;
  border: 3px solid var(--black) !important;
  padding: 32px !important;
}

.summary-content {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.summary-block {
  font-size: 15px;
  line-height: 1.8;
  color: #1e293b;
}

.summary-block strong {
  color: var(--black);
  font-size: 16px;
  display: block;
  margin-bottom: 4px;
}
""")
