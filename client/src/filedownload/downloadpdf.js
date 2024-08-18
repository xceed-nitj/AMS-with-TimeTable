import pdfMakeInitializer from './pdfMakeInitializer';

pdfMakeInitializer(); 

import header from '../assets/header.png';
import footer from '../assets/footer.png';
import { CustomTh, CustomLink, CustomBlueButton } from '../styles/customStyles';


// pdfMake.vfs = pdfFonts.pdfMake.vfs;

//pdfMake.vfs=pdfFonts && pdfFonts.pdfMake ? pdfFonts.pdfMake.vfs : globalThis.pdfMake.vfs;


function downloadPDF(timetableData, summaryData, type, ttdata, updatedTime, headTitle,notes) {
  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
// console.log('type',type)
// console.log('ttdataaaa',timetableData)
// console.log('passed time',updatedTime)
// console.log('title',headTitle)

const session = ttdata[0].session;
  const dept = ttdata[0].dept;
  const updatedTime1 =updatedTime;
  const headTitle1 =headTitle;
  const printNotes=notes;

  const tableData = [];
  let subheading = '';

  if (type == 'sem') {
    subheading = 'Degree & Sem:';
  } else if (type =='faculty') {
    subheading = 'Faculty Name: Dr.';
  }
  else if (type =='room') {
    subheading = 'Room: ';
  }
  const subheading1=subheading;
// console.log(subheading)
  const tableHeader = [
    'Day/Period',
    '8:30 AM - 9:25 AM',
    '9:30 AM - 10:25 AM',
    '10:30 AM - 11:25 AM',
    '11:30 AM - 12:25 PM',
    '12:30 PM - 1:30 PM',
    '1:30 PM - 2:25 PM',
    '2:30 PM - 3:25 PM',
    '3:30 PM - 4:25 PM',
    '4:30 PM - 5:25 PM',
  ];

  tableData.push(tableHeader);

  days.forEach((day) => {
    const row = [day];

    for (let period = 1; period <= 9; period++) {
      let cellContents = [];
      let cellData;

      if (period === 5) {
        cellData = timetableData[day]['lunch'];
        console.log(cellData)
        if(!cellData || cellData.length==0 || cellData[0].length==0 || !cellData[0])
        {      
        console.log(cellData)
        // cellData='Lunch'
        row.push({
          // colSpan: 4,
          text: 'Lunch',
          fontSize: 10,
          alignment: 'center', // Adjust alignment as needed
        });
        
        continue;
      }
      // continue;
      } else if (period < 5) {
        cellData = timetableData[day][`period${period}`];
      } else {
        cellData = timetableData[day][`period${period - 1}`];
      }
      if(cellData)
      {
      cellData.forEach(slot => {
        slot.forEach(cell => {
          cellContents.push({
            text: `${cell.subject}\n`,
            fontSize: 11, // Set the font size for cell.subject (adjust as needed)
            // Set other properties as needed
          });
      
          // If you want a separate style for cell.room
          if (cell.room) {
          cellContents.push({
            text: `(${cell.room})`,
            fontSize: 9, // Set the font size for cell.room
            // Set other properties as needed
          });
        }
        if(type=='faculty')
        {
          if (cell.faculty) {
            cellContents.push({
              text: `[${cell.faculty}]`,
              fontSize: 10, // Set the font size for cell.room
              // Set other properties as needed
            });
          }
  
        }
  


        });
      
      });
    }

      row.push({
        stack: cellContents,
        alignment: 'center',
      });
    }

    tableData.push(row);
  });

  const summaryTableData = [];
  const summaryTableData2 = [];
    
  const summaryTitleRow = [
    { text: 'Summary', bold: true, alignment: 'left', colSpan: 7, border: [false, false, false, false] },
    {}, {}, {}, {},{},{} // Empty cells to match the colSpan
  ];
  summaryTableData.push(summaryTitleRow);

  const summaryTableHeader = [
    { text: 'Abbreviation', bold: true, alignment: 'center', fontSize: 10 },
    { text: 'Subject Code', bold: true, fontSize: 10 },
    { text: 'Subject Name', bold: true, fontSize: 10 },
    { text: 'Hours', bold: true, alignment: 'center', fontSize: 10 },
  ];

  // if (type !== 'room') {
    summaryTableHeader.push({ text: 'Subject Type', bold: true, fontSize: 10 });
  // }

  if (type !== 'faculty') {
    summaryTableHeader.push({ text: 'Faculty Name', bold: true, fontSize: 10 });
  }

  if (type !== 'room') {
    summaryTableHeader.push({ text: 'Room No', bold: true, fontSize: 10 });
  }

  
  if (type !== 'sem') {
    summaryTableHeader.push({ text: 'Semester', bold: true, fontSize: 10 });
  }

  summaryTableData.push(summaryTableHeader);

  // Iterate through the summary data and add rows to the table
  Object.keys(summaryData).forEach((subject,index) => {
    const summaryRow = [];
    summaryRow.push({ text: summaryData[subject].originalKeys.join(', '), fontSize: 10, alignment: 'center' });
    summaryRow.push({ text: summaryData[subject].subCode, fontSize: 10, alignment: 'center' });
    summaryRow.push({ text: summaryData[subject].subjectFullName, fontSize: 10 });
    summaryRow.push({ text: summaryData[subject].count, fontSize: 10,alignment: 'center' });
    summaryRow.push({ text: summaryData[subject].subType, fontSize: 10, alignment: 'center' });

    if (type !== 'faculty') {
      summaryRow.push({ text: summaryData[subject].faculties.join(', '), fontSize: 10 });
    }

    if (type !== 'room') {
      summaryRow.push({ text: summaryData[subject].rooms.join(', '), fontSize: 10 });
    }

    // if (type !== 'sem') {
    //   summaryRow.push({ text: summaryData[subject].faculties.join(', '), fontSize: 10 });
    // }

    if (type !== 'sem' && type !== 'room') {
      summaryRow.push({ text: summaryData[subject].faculties.join(', '), fontSize: 10 });
    }
    else{
      if (type !== 'sem')
      {
      summaryRow.push({ text: summaryData[subject].rooms.join(', '), fontSize: 10 });
      }
    }


    if (index <= 18) {
      summaryTableData.push(summaryRow);
    } else {
      summaryTableData2.push(summaryRow);
    }
  });

  const summarySignRow = [
    { text: 'TimeTable Incharge', bold: true, alignment: 'left', colSpan: 6, border: [false, false, false, false] },
    {}, {}, {}, {},{}, // Empty cells to match the colSpan
    { text: 'HoD', bold: true, alignment: 'right',colSpan: 1, border: [false, false, false, false] },
  
  ];

  const blankRow = [{text:'',colSpan:7,border: [false, false, false, false] }, {}, {}, {}, {},{},{}];
  if (summaryTableData2.length == 0) {
    summaryTableData.push(blankRow);
    summaryTableData.push(blankRow);
    summaryTableData.push(blankRow);
    summaryTableData.push(blankRow);

    summaryTableData.push(summarySignRow);
  } else {
    summaryTableData2.push(blankRow);
    summaryTableData2.push(blankRow);
    summaryTableData.push(blankRow);
    summaryTableData.push(blankRow);

    summaryTableData2.push(summarySignRow);
  }

  const headerImage = new Image();
  headerImage.src = header;

  headerImage.onload = () => {
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    canvas.width = headerImage.width;
    canvas.height = headerImage.height;
    context.drawImage(headerImage, 0, 0);
    const headerImageDataURL = canvas.toDataURL('image/png');

    const footerImage = new Image();
    footerImage.src = footer;

    footerImage.onload = () => {
      const footerCanvas = document.createElement('canvas');
      const footerContext = footerCanvas.getContext('2d');
      footerCanvas.width = footerImage.width;
      footerCanvas.height = footerImage.height;
      footerContext.drawImage(footerImage, 0, 0);
      const footerImageDataURL = footerCanvas.toDataURL('image/png');

      const documentDefinition = {
        pageOrientation: 'landscape',
        header: {
          image: headerImageDataURL,
          width: 300,
          alignment: 'center',
        },
        footer: {
          image: footerImageDataURL,
          width: 250,
          alignment: 'center',
        },
        content: [
          {
            text: `Department of ${dept}`,
            fontSize: 12,
            bold: true,
            margin: [5, 10, 40, 5],
            alignment: 'center',
          },
          {
            columns: [
              {
                text: `${subheading1}${headTitle1}`,
                fontSize: 12,
                bold: true,
                alignment: 'left',
              },
              {
                text: `Session: ${session}`,
                fontSize: 12,
                bold: true,
                alignment: 'center',
              },
              {
                text: `Last Locked on: ${updatedTime1}`,
                fontSize: 12,
                bold: true,
                alignment: 'right',
              },
            ],
            margin: [0, 0, 0, 0], // Add top margin if needed
          },


          {
            table: {
              body: tableData,
              alignment: 'center',
            },
          },

          ...(notes && notes.length > 0
            ? [
                {
                  text: 'Notes:',
                  fontSize: 10,
                  bold: true,
                  margin: [0, 2, 0, 2], // top, right, bottom, left
                },
                {
                  ul: notes.map(noteArray => noteArray.map(note => ({ text: note, fontSize:10 }))),
                },
              ]
            : []),

          type === 'sem' ? { text: '(summary of the timetable given below)', fontSize: 10, alignment:'left',margin:[0,5,0,0] }:null,
          {
            stack: [
            // type === 'sem' ? { text: '', pageBreak: 'before' } : null,

          // {
          //   text: 'Summary:',
          //   fontSize: 10,
          //   bold: true,
          //   margin: [0, 5, 40, 5],
          //   alignment: 'left',
          // },
          {
            unbreakable: true,
          stack:[
          {
            table: {
              fontSize: 10,
              body: summaryTableData,
              alignment: 'center',
            },
            margin:[0,5,10,10],
          },    
                  
        ],
      
      },
      summaryTableData2.length==0?null:{
        pageBreak:"before",
        unbreakable: true,
        stack: [
          {
            table: {
              fontSize: 10,
              body: summaryTableData2,
              alignment: 'center',
            },
          },
        ],
      }
                // {
          //   table: {
          //     widths: ['*', '*'], // Two equal-width columns
          //     body: [
          //       [
          //         {
          //           text: 'Time Table Incharge',
          //           fontSize: 10,
          //           bold: true,
          //           alignment: 'left',

          //         },
          //         {
          //           text: 'Head of the Department',
          //           fontSize: 10,
          //           bold: true,
          //           alignment: 'right',
          //           // margin: [10,10,10,10],
          //         },
          //       ],
          //     ],
          //   },
          //   margin: [0,20,0,0],
          //   layout: 'noBorders', // Use 'noBorders' layout for accurate height calculation
          //   pageBreak: 'auto',
          // },
 // layout: 'noBorders',
            // margin: [0, 30, 0, 0],
        ]
      }
        ],
      };

      pdfMake.createPdf(documentDefinition).download(`${headTitle}_timetable.pdf`);
    };
  };
}

export default downloadPDF;
