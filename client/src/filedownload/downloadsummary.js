import pdfMakeInitializer from './pdfMakeInitializer';
// Import other dependencies

pdfMakeInitializer(); 

import header from '../assets/header.png';
import footer from '../assets/footer.png';

//pdfMake.vfs = pdfFonts && pdfFonts.pdfMake ? pdfFonts.pdfMake.vfs : globalThis.pdfMake.vfs;

//pdfMake.vfs = pdfFonts.vfs;

const loadImage = (src) => new Promise((resolve, reject) => {
  const image = new Image();
  image.onload = () => resolve(image);
  image.onerror = reject;
  image.src = src;
});

const generateSummaryTablePDF = async (allFacultySummaries, deptfaculty, session, dept) => {
  try {
    const [headerImage, footerImage] = await Promise.all([
      loadImage(header),
      loadImage(footer),
    ]);

    const headerCanvas = document.createElement('canvas');
    const headerContext = headerCanvas.getContext('2d');
    headerCanvas.width = headerImage.width;
    headerCanvas.height = headerImage.height;
    headerContext.drawImage(headerImage, 0, 0);
    const headerImageDataURL = headerCanvas.toDataURL('image/png');

    const footerCanvas = document.createElement('canvas');
    const footerContext = footerCanvas.getContext('2d');
    footerCanvas.width = footerImage.width;
    footerCanvas.height = footerImage.height;
    footerContext.drawImage(footerImage, 0, 0);
    const footerImageDataURL = footerCanvas.toDataURL('image/png');

    const facultyTotals = new Map();
    const rows = [];
    let sNo = 0;

    const sortedFacultySummaries = allFacultySummaries.sort((a, b) => {
      const designationOrder = {
        'Professor': 1,
        'Associate Professor': 2,
        'Assistant Professor Grade-i': 3,
        'Assistant Professor Grade-ii': 4,
        'Assistant Professor': 5,
      };

      const orderA = designationOrder[deptfaculty.find(f => f.name === a.faculty)?.designation] || 0;
      const orderB = designationOrder[deptfaculty.find(f => f.name === b.faculty)?.designation] || 0;

      return orderA - orderB;
    });

    sortedFacultySummaries.forEach((facultyObj, index) => {
      const faculty = facultyObj.faculty;
      const summaryData = facultyObj.summaryData;
      const facultyDetails = deptfaculty.find((f) => f.name === faculty);
    
      // Ensure summaryData is an object before proceeding
      if (typeof summaryData === 'object' && summaryData !== null) {
        // Convert the object values to an array
        const summaryDataArray = Object.values(summaryData);
      // Initialize total hours for each faculty
      facultyTotals.set(faculty, 0);

      let totalHrs = 0;

      for (let i = 0; i < summaryDataArray.length; i++) {
        totalHrs += summaryDataArray[i].count || 0;
      }
  
      facultyTotals.set(faculty, totalHrs);
  
      const facultyRows = summaryDataArray.map((summary, subIndex) => {
        const isFirstRow = subIndex === 0;
        // Increment sNo only for the first row of each faculty
        sNo = isFirstRow ? sNo + 1 : sNo;

        const row = [
          { text: isFirstRow ? sNo : '', rowSpan: isFirstRow ? summaryData.length : 1, alignment: 'center',minHeight: 20,pageBreak: 'auto'  },
          { text: isFirstRow ? faculty : '', rowSpan: isFirstRow ? summaryData.length : 1 ,minHeight: 20,pageBreak: 'auto' },
          { text: isFirstRow ? facultyDetails.designation : '', rowSpan: isFirstRow ? summaryData.length : 1,minHeight: 20,pageBreak: 'auto'  },
          { text: summary.faculties && summary.faculties.length > 0 ? summary.faculties.join(', ') : summary.subSem, alignment: 'center', minHeight: 20,pageBreak: 'auto' },
          { text: summary.subCode || '', alignment: 'center',minHeight: 20,pageBreak: 'auto' },
          { text: summary.subjectFullName || '', alignment: 'left',minHeight: 20,pageBreak: 'auto' },
          { text: summary.subType || '', alignment: 'center',minHeight: 20,pageBreak: 'auto' },
          { text: summary.count || 0, alignment: 'center',minHeight: 20,pageBreak: 'auto' },
          { text: isFirstRow ? totalHrs : '', rowSpan: isFirstRow ? summaryData.length : 1, alignment: 'center',pageBreak: 'auto' },
        ];

        return row;
      });
    // }
      rows.push(...facultyRows);
  }
    });
    const docDefinition = {
      pageOrientation: 'landscape',
      header: {
        image: headerImageDataURL,
        width: 300,
        alignment: 'center',
              },
      footer: {
        margin: [40, 10, 40, 0], // Adjust margins as needed
        stack: [
          // Draw a line above the footer image
        
          // { canvas: [{ type: 'line', x1: 0, y1: 26, x2: 762, y2: 26, lineWidth: 1, lineColor: 'black' }] },
          // Add the footer image
          { text: '\n' },
           { image: footerImageDataURL, width: 250, alignment: 'center' },
        ],
      },
      pageMargins: [40, 40, 40, 60],
      content: [
        {
          text: `Department of ${dept}`,
          fontSize: 12,
          bold: true,
          margin: [5, 0, 40, 0],
          alignment: 'center',
        },
        { text: `Faculty Load Allocation for the session ${session}`, alignment: 'center' },
        {
          table: {
            headerRows: 1,
            widths: [30, 100, 70, 80, 80, 200, 70, 20, 30],
            alignment: 'center',
            body: [
              [
                { text: 'S.No', alignment: 'center' },
                { text: 'Faculty Name', alignment: 'center' },
                { text: 'Designation', alignment: 'center' }, // Add a new column for designation
                { text: 'Semester', alignment: 'center' },
                { text: 'Subject Code', alignment: 'center' },
                { text: 'Subject Name', alignment: 'center' },
                { text: 'Type', alignment: 'center' },
                { text: 'Hrs', alignment: 'center' },
                { text: 'Total Hrs', alignment: 'center' },
              ],
              ...rows,
            ],
          },
        },
        {
          columns: [
            {
              text: 'Time Table Incharge',
              fontSize: 12,
              bold: true,
              alignment: 'left',
            },
            {
              text: 'Head of the Department',
              fontSize: 12,
              bold: true,
              alignment: 'right',
            },
          ],
          margin: [0, 20, 0, 0],
        },
      ],
      defaultStyle: {
        fontSize: 12,
        pageBreak: 'auto'
      },
      // pageMargins: [40, 40, 40, 60],
      
      styles: {
        header: {
          fontSize: 18,
          bold: true,
          alignment: 'center',
        },
      },
    };
    
    pdfMake.createPdf(docDefinition).open();
  } catch (error) {
    console.error('Error during PDF generation:', error);
  }
};

export default generateSummaryTablePDF;
