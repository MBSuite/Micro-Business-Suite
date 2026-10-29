with open('app/admin/backup/page.tsx', 'r') as f:
    content = f.read()

# Find bottom info card section start
start = content.find('          {/* Info Card */}\n          <div className="space-y-6">')
if start != -1:
    # Find its end (before grid close)
    end = content.find('          </div>\n\n        </div>', start)
    if end == -1:
        end = content.find('          </div>\n\n        </div>', start)
    info_block = content[start:end + len('          </div>')]
    # Remove bottom info block
    content = content[:start] + content[end + len('          </div>'):]

    # Find new top opening
    top = '          {/* Info Card (คำเตือน + สถานะ) — ย้ายมาไว้ก่อน */}\n          <div className="space-y-6">'
    top_idx = content.find(top)
    if top_idx != -1:
        insert_pos = top_idx + len(top)
        # Extract inner cards from info_block (skip opening tag line)
        inner = info_block[len('          {/* Info Card */}\n          <div className="space-y-6">'):]
        # Remove the duplicate opening div tag from inner
        inner = inner.replace('<div className="space-y-6">\n', '', 1)
        # Wait, the info_block already starts with opening div. We just need content after it.
        # Let's manually extract the two inner card blocks
        # Actually let's just insert the full inner cards after the top opening
        # Find the inner content by taking everything after the opening line
        lines_inner = info_block.split('          <div className="space-y-6">\n', 1)
        if len(lines_inner) == 2:
            inner_content = lines_inner[1].rstrip()
            # But we also need to close it properly. The info_block includes its closing </div>
            # So inner_content should include the closing </div> at the end.
            # Let's check: info_block = opening + inner + closing
            inner_content = lines_inner[1]
            # Remove the extra closing div that closes the info card (before the grid close)
            # The info_block ends with "          </div>" which closes the info card section
            # We want to keep that.
            content = content[:insert_pos] + inner_content + content[insert_pos:]

    with open('app/admin/backup/page.tsx', 'w') as f:
        f.write(content)
    print('Done')
