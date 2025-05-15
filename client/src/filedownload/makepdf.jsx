import React from 'react';
import pdfMakeInitializer from './pdfMakeInitializer';
// import * as pdfFonts from 'pdfmake/build/vfs_fonts';
// Import other dependencies



pdfMakeInitializer();

import header from '../assets/header.png'
import footer from '../assets/footer.png'; // Replace with the actual path to your footer image
import { Container, Heading, Input } from '@chakra-ui/react';
import { CustomTh, CustomLink, CustomBlueButton } from '../styles/customStyles';
import {
  Table,
  TableContainer,
  Tbody,
  Td,
  Th,
  Thead,
  Tr,
} from '@chakra-ui/table';


// pdfMake.vfs = pdfFonts.vfs;


// pdfMake.vfs = pdfFonts.pdfMake.vfs;

// pdfMake.vfs = pdfFonts && pdfFonts.pdfMake ? pdfFonts.pdfMake.vfs : globalThis.pdfMake.vfs;


class PDFGenerator extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      headerImageDataURL: null,
      footerImageDataURL: null, // Add this line
    };
  }

  generatePDF = () => {
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
    const timetableData = this.props.timetableData; // Assuming you pass the timetable data as a prop
    const summaryData = this.props.summaryData;
    const type = this.props.type;
    const ttdata = this.props.ttdata;
    const updatedTime = this.props.updatedTime;
    const headTitle = this.props.headTitle;
    const notes = this.props.notes;
    console.log('session-ttdata',ttdata)
    // console.log('first item:', ttdata && ttdata[0]);
    const session = ttdata.session;
    const dept = ttdata.dept;
   
    const tableData = [];
    const { headerImageDataURL } = this.state; // Use the header image URL from the state

    let subheading = ''
    if (type == 'sem') {
      subheading = 'Degree & Sem:'
    }
    else if (type == 'faculty') {
      subheading = 'Faculty Name: Dr.'
    }
    else if (type == 'room') {
      subheading = 'Room No:'
    }

    // Add the table header
    // const tableHeader = ['Day/Period', ...[1, 2, 3, 4, 5, 6, 7, 8].map(period => period.toString())];
    const tableHeader = ['Day/Period', '8:30 AM - 9:25 AM ', '9:30 AM - 10:25 AM', '10:30 AM - 11:25 AM', '11:30 AM - 12:25 PM', '12:30 PM - 1:30 PM', '1:30 PM - 2:25 PM', '2:30 PM - 3:25 PM', '3:30 PM - 4:25 PM', '4:30 PM - 5:25 PM']
    tableData.push(tableHeader);
    days.forEach(day => {
      const row = [day];
      for (let period = 1; period <= 9; period++) {
        let cellContents = [];
        // Add the table rows
        let cellData;

        // Handle lunch break
        if (period === 5) {
          // Merge the 5th column into a single cell
          cellData = timetableData[day]['lunch'];
          if (cellData.length == 0) {
            // console.log(cellData)
            // cellData='Lunch'
            row.push({
              // colSpan: 4,
              text: 'Lunch',
              fontSize: 10,
              alignment: 'center', // Adjust alignment as needed
            });
            continue;
          }
          // continue; // Skip the rest of the loop for this period
        } else if (period < 5) {
          // Periods before lunch
          cellData = timetableData[day][`period${period}`];
        } else {
          // Periods after lunch, shift period to access the next slot
          cellData = timetableData[day][`period${period - 1}`];
        }

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

            if (type == 'faculty') {
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
        row.push({
          stack: cellContents,
          alignment: 'center', // Set the desired alignment for the entire row
        });

      }
      tableData.push(row);
    });
    const summaryTableData = [];
    const summaryTableData2 = [];

    const summaryTitleRow = [
      { text: 'Summary', bold: true, alignment: 'left', colSpan: 7, pageBreak: 'auto', border: [false, false, false, false] },
      {}, {}, {}, {}, {}, {} // Empty cells to match the colSpan
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
    Object.keys(summaryData).forEach((subject, index) => {
      const summaryRow = [];
      summaryRow.push({ text: summaryData[subject].originalKeys.join(', '), fontSize: 10, alignment: 'center' });
      summaryRow.push({ text: summaryData[subject].subCode, fontSize: 10, alignment: 'center' });
      summaryRow.push({ text: summaryData[subject].subjectFullName, fontSize: 10 });
      summaryRow.push({ text: summaryData[subject].count, fontSize: 10, alignment: 'center' });
      summaryRow.push({ text: summaryData[subject].subType, fontSize: 10, alignment: 'center' });

      if (type !== 'faculty') {
        summaryRow.push({ text: summaryData[subject].faculties.join(', '), fontSize: 10 });
      }

      if (type !== 'room') {
        summaryRow.push({ text: summaryData[subject].rooms.join(', '), fontSize: 10 });
      }

      if (type !== 'sem' && type !== 'room') {
        summaryRow.push({ text: summaryData[subject].faculties.join(', '), fontSize: 10 });
      }
      else {
        if (type !== 'sem') {
          summaryRow.push({ text: summaryData[subject].rooms.join(', '), fontSize: 10 });
        }
      }
      summaryTableData.push(summaryRow);
      // if (index <= 18) {
      //   summaryTableData.push(summaryRow);
      // } else {
      //   summaryTableData2.push(summaryRow);
      // }
    });

    const summarySignRow = [
      { text: 'TimeTable Incharge', bold: true, alignment: 'left', colSpan: 6, border: [false, false, false, false] },
      {}, {}, {}, {}, {}, // Empty cells to match the colSpan
      { text: 'HOD', bold: true, alignment: 'right', colSpan: 1, border: [false, false, false, false] },

    ];

    const blankRow = [{ text: '', colSpan: 7, border: [false, false, false, false] }, {}, {}, {}, {}, {}, {}];
    summaryTableData.push(blankRow);
    summaryTableData.push(blankRow);
    summaryTableData.push(blankRow);
    summaryTableData.push(blankRow);

    summaryTableData.push(summarySignRow);
    console.log(summaryTableData.length,summaryTableData)

    
    const footerImage = new Image();
    footerImage.src = footer; // Replace with the actual path to your image

    // Once the image is loaded, convert it to a data URL and update the state
    footerImage.onload = () => {
      const footerCanvas = document.createElement('canvas');
      const footerContext = footerCanvas.getContext('2d');
      footerCanvas.width = footerImage.width;
      footerCanvas.height = footerImage.height;
      footerContext.drawImage(footerImage, 0, 0);
      const footerImageDataURL = footerCanvas.toDataURL('image/png');

      this.setState({ footerImageDataURL });
    };



    const headerImage = new Image();
    headerImage.src = header; // Replace with the actual path to your image

    // Once the image is loaded, convert it to a data URL and update the state
    headerImage.onload = () => {
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');
      canvas.width = headerImage.width;
      canvas.height = headerImage.height;
      context.drawImage(headerImage, 0, 0);
      const headerImageDataURL = canvas.toDataURL('image/png');

      this.setState({ headerImageDataURL }, () => {
        const documentDefinition = {
          pageOrientation: 'landscape',
          header: {
            image: this.state.headerImageDataURL, // Use the data URL from state
            width: 300,
            alignment: 'center', // Adjust the width as needed
          },
          footer: {
            image: this.state.footerImageDataURL, // Use the data URL from state
            width: 250,
            alignment: 'center', // Adjust the width as needed
          },
          content: [
            {
              text: `Department of ${dept}`,
              fontSize: 12,
              bold: true,
              margin: [5, 10, 40, 5],
              alignment: 'center', // Adjust the width as needed

            },
            {
              table: {
                widths: ['*', '*', '*'], // Three columns with equal width
                body: [
                  [
                    {
                      text: `${subheading}${headTitle}`,
                      fontSize: 12,
                      bold: true,
                      alignment: 'left',
                    },
                    {
                      text: `Session:${session}`,
                      fontSize: 12,
                      bold: true,
                      alignment: 'center',
                    },
                    {
                      text: `Last Locked on: ${updatedTime}`,
                      fontSize: 12,
                      bold: true,
                      alignment: 'right',
                    },
                  ],
                ],
              },
              layout: 'noBorders', // Remove table borders
            },

            {
              table: {
                body: tableData,
                fontSize: 10,
                alignment: 'center'
              },
            },
            ...(notes.length > 0
              ? [
                {
                  text: 'Notes:',
                  fontSize: 10,
                  bold: true,
                  margin: [0, 2, 0, 2], // top, right, bottom, left
                },
                {
                  ul: notes.map(noteArray => noteArray.map(note => ({ text: note, fontSize: 8 }))),
                },
              ]
              : []),


            type === 'sem' ? { text: '(summary of the timetable given below)', fontSize: 10, alignment: 'left', margin: [0, 5, 0, 0] } : null,

            type === 'sem' ||type === 'room' ? { text: '', pageBreak: "before" } : null,
            // type === 'sem' ? { text: '', pageBreak: 'before' } : null,

            // {
            //   text: 'Summary:',
            //   fontSize: 10,
            //   bold: true,
            //   margin: [0, 5, 40, 5],
            //   alignment: 'left',
            // },
            {
              // pageBreak : "before",
              unbreakable: false,
              stack: [
                {
                  table: {
                    fontSize: 10,
                    body: summaryTableData,
                    alignment: 'center',
                  },
                },
              ],
            },

          ],
          pageBreak: 'auto',
        }
        console.log(documentDefinition)
        pdfMake.createPdf(documentDefinition).open();
      });
    };
  };

  render() {
    return (
      <div>
        <CustomBlueButton onClick={this.generatePDF}>Generate PDF</CustomBlueButton>
      </div>
    );
  }
}

export default PDFGenerator;
