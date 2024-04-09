import html2pdf from 'html2pdf.js';

export default function downloadCertificatePDF() {
  const graph = document.getElementsByClassName("svg-img")[0];

  // Ensure that anchor elements have href attributes for hyperlinks
  const anchorElements = graph.getElementsByTagName("a");
  for (const anchorElement of anchorElements) {
    if (!anchorElement.getAttribute("href")) {
      anchorElement.setAttribute("href", "#"); // Set a default href if not present
    }
  }

  // Use html2pdf to create a PDF with selectable text and hyperlinks
  html2pdf(graph, {
    margin: 20,
    filename: 'certificate.pdf',
    image: { type: 'png', quality: 0.98 },
    html2canvas: { scale: 2 },
    jsPDF: { unit: 'pt', format: 'letter', orientation: 'landscape', text: 'text' },
  });
}
