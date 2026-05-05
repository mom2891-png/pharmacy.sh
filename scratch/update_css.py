
import os

css_path = 'style-new.css'
with open(css_path, 'r', encoding='utf-8') as f:
    content = f.read()

new_css = """
/* Guideline Major Cards Uniformity */
.guideline-major-card {
  min-height: 340px;
  height: auto;
  display: flex;
  flex-direction: column;
  overflow: visible;
  padding: 24px !important;
  background: var(--white);
  border: 4px solid var(--black) !important;
  box-shadow: 8px 8px 0px var(--black) !important;
  transition: all 0.2s ease;
  position: relative;
  margin-bottom: 24px;
}

.guideline-major-card:hover {
  transform: translate(-4px, -4px);
  box-shadow: 12px 12px 0px var(--black) !important;
}

.guideline-sub-grid {
  flex: 1;
  display: grid;
  grid-template-columns: 1fr 1fr;
  grid-auto-rows: 48px;
  gap: 12px;
  padding-top: 16px;
  border-top: 2px dashed #000;
  margin-top: 10px;
}

.guideline-sub-btn {
  font-family: 'SUITE', sans-serif;
  font-weight: 800 !important;
  border: 3px solid var(--black) !important;
  box-shadow: 3px 3px 0px var(--black) !important;
  background: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
}

.guideline-sub-btn:hover {
  background: var(--secondary) !important;
  color: white !important;
  transform: translate(-1px, -1px);
  box-shadow: 4px 4px 0px var(--black) !important;
}

.more-toggle-container {
  grid-column: 1 / -1;
  display: flex;
  justify-content: center;
  margin-top: 4px;
}

.more-toggle-btn {
  width: 100%;
  background: #eef2ff;
  border: 3px solid var(--black);
  padding: 10px;
  font-weight: 900;
  font-size: 13px;
  cursor: pointer;
  box-shadow: 3px 3px 0px var(--black);
  transition: all 0.1s;
  text-transform: uppercase;
  margin-top: 10px;
}

.more-toggle-btn:hover {
  background: var(--primary);
  color: white;
  transform: translate(-2px, -2px);
  box-shadow: 5px 5px 0px var(--black);
}

.more-toggle-btn.active {
  background: var(--black);
  color: white;
}

/* Hidden items logic */
.guideline-sub-btn.extra-item {
  display: none;
}

.guideline-major-card.expanded .guideline-sub-btn.extra-item {
  display: flex;
}
"""

with open(css_path, 'w', encoding='utf-8') as f:
    f.write(content + new_css)
