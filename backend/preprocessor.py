from fitz import open

def remove_f_type_prefix(full_file_type: str):
    if "/" in full_file_type:
        return full_file_type.split('/', 1)[1]
    return full_file_type


def process_pdf(text_content):
    doc = open(stream=text_content, filetype="pdf")
    extracted_text = []
    
    for page in doc:
        text = page.get_text()
        extracted_text.append(text)
    
    doc.close()
    return "\n".join(extracted_text)