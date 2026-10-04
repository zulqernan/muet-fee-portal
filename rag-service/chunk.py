import re
from pypdf import PdfReader


def load_text(path):
    reader = PdfReader(path)
    pages = [p.extract_text() or "" for p in reader.pages]
    text = "\n".join(pages)
    # har page ka repeated header hata do
    return re.sub(r"MUET Fee Structure.*Page \d+", "", text)


def split_sections(text):
    chunks = []
    current = []
    expected = 1  # agla section number jo hum dhoondh rahe hain
    for line in text.splitlines():
        s = line.strip()
        if not s:
            continue
        m = re.match(r"^(\d+)\.\s+\S", s)
        if m and int(m.group(1)) == expected:
            if current:
                chunks.append("\n".join(current))
            current = [s]
            expected += 1
        else:
            current.append(s)
    if current:
        chunks.append("\n".join(current))
    return chunks


if __name__ == "__main__":
    chunks = split_sections(load_text("docs/muet-fee-structure.pdf"))
    print("Total chunks:", len(chunks))
    for i, c in enumerate(chunks):
        first_line = c.splitlines()[0]
        print(f"[{i}] {len(c)} chars | {first_line}")