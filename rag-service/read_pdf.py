import os
from dotenv import load_dotenv
from pypdf import PdfReader

load_dotenv()
print("API key loaded:", bool(os.getenv("GEMINI_API_KEY")))

reader = PdfReader("docs/muet-fee-structure.pdf")
print("Pages:", len(reader.pages))

text = reader.pages[0].extract_text()
print("Characters on page 1:", len(text))
print("---")
print(text[:600])