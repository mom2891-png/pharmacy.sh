
import os

css_path = 'style-new.css'
with open(css_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Remove the previous colorful additions and add clean ones
# First, let's find where the previous addition started
marker = '/* Guideline Major Cards Uniformity */'
if marker in content:
    content = content.split(marker)[0]

new_css = """
/* Guideline Major Cards Uniformity - Clean Version */
.guideline-major-card {
  min-height: 320px;
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
  background: #fdfdfd;
}

.guideline-major-card .badge-mini {
  font-size: 10px;
  padding: 4px 8px;
  width: fit-content;
  background: var(--black);
  color: var(--white);
  border: none;
  font-weight: 900;
  margin-bottom: 8px;
}

.guideline-major-card .card-title {
  margin-bottom: 0;
  font-size: 22px;
  font-weight: 900;
  color: var(--black);
}

.guideline-sub-grid {
  flex: 1;
  display: grid;
  grid-template-columns: 1fr 1fr;
  grid-auto-rows: 48px;
  gap: 12px;
  padding-top: 16px;
  border-top: 2px dashed var(--black);
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
  font-size: 12px;
  color: var(--black);
  transition: all 0.1s;
}

.guideline-sub-btn:hover {
  background: var(--primary) !important;
  color: white !important;
  transform: translate(-1px, -1px);
  box-shadow: 4px 4px 0px var(--black) !important;
}

.more-toggle-btn {
  width: 100%;
  background: #f8fafc;
  border: 3px solid var(--black);
  padding: 10px;
  font-weight: 900;
  font-size: 13px;
  color: var(--black);
  cursor: pointer;
  box-shadow: 3px 3px 0px var(--black);
  transition: all 0.1s;
  text-transform: uppercase;
  margin-top: 16px;
}

.more-toggle-btn:hover {
  background: var(--black);
  color: var(--white);
  transform: translate(-2px, -2px);
  box-shadow: 5px 5px 0px var(--black);
}

.more-toggle-btn.active {
  background: var(--black);
  color: var(--white);
}

/* Hidden items logic */
.guideline-sub-btn.extra-item {
  display: none;
}

.guideline-major-card.expanded .guideline-sub-btn.extra-item {
  display: flex;
}

.delete-btn-mini {
  position: absolute;
  top: 8px;
  right: 8px;
  width: 28px;
  height: 28px;
  font-size: 14px;
  background: white;
  border: 2px solid var(--black);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.1s;
  z-index: 10;
}

.delete-btn-mini:hover {
  background: #ef4444;
  color: white;
}
"""

with open(css_path, 'w', encoding='utf-8') as f:
    f.write(content + new_css)
