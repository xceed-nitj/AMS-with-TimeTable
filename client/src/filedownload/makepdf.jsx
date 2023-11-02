import React from 'react';
import * as pdfMake from 'pdfmake/build/pdfmake';
import * as pdfFonts from 'pdfmake/build/vfs_fonts';

// (pdfMake as any).vfs = pdfFonts.pdfMake.vfs;

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


// pdfMake.vfs = pdfFonts.pdfMake.vfs;
pdfMake.vfs=pdfFonts && pdfFonts.pdfMake ? pdfFonts.pdfMake.vfs : globalThis.pdfMake.vfs;

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
    const type=this.props.type;
    const ttdata=this.props.ttdata; 

    const session=ttdata[0].session;
    const dept=ttdata[0].dept;
    // console.log('summaryDate',summaryData)
    const tableData = [];
    const { headerImageDataURL } = this.state; // Use the header image URL from the state

    // Add the table header
    // const tableHeader = ['Day/Period', ...[1, 2, 3, 4, 5, 6, 7, 8].map(period => period.toString())];
    const tableHeader = ['Day/Period','8:30 AM - 9:30 AM ','9:30 AM - 10:30 AM','10:30 AM - 11:30 AM','11:30 AM - 12:30 AM','12:30 AM - 1:30 AM','1:30 AM - 2:30 AM','2:30 AM - 3:30 AM','3:30 AM - 4:30 AM','3:30 AM - 4:30 AM']
    tableData.push(tableHeader);
    days.forEach(day => {
        const row = [day];
        for (let period = 1; period <= 9; period++) {
    let cellContents=[];
    // Add the table rows
    let cellData;
      
    // Handle lunch break
    if (period === 5) {
      // Merge the 5th column into a single cell
      row.push({
        // colSpan: 4,
        text: 'Lunch',
        alignment: 'center', // Adjust alignment as needed
      });
      continue; // Skip the rest of the loop for this period
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
          text: cell.subject,
          fontSize: 12, // Set the font size (adjust as needed)
        // Set the text to bold (adjust as needed)
        });
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
    const summaryTableHeader = [
      { text: 'Abbreviation', bold: true, alignment: 'center', fontSize: 10 },
      { text: 'Subject Code', bold: true, fontSize: 10 },
      { text: 'Subject Name', bold: true, fontSize: 10 },
      { text: 'Hours', bold: true, alignment: 'center', fontSize: 10 },
    ];
    
    if (type !== 'room') {
      summaryTableHeader.push({ text: 'Subject Type', bold: true, fontSize: 10 });
    }
    
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
    Object.keys(summaryData).forEach((subject) => {
      const summaryRow = [];
      summaryRow.push({ text: subject, fontSize: 10, alignment: 'center' });
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
    
      if (type !== 'sem') {
        summaryRow.push({ text: summaryData[subject].subSem, fontSize: 10 });
      }
    
      summaryTableData.push(summaryRow);
    });
    

    // const signatures = [
    //   { text: 'Time Table Coordinator', bold: true },
    //   { text: ' ', bold: true },
    //   { text: '', bold: true },
    //   { text: '', bold: true },
    //   { text: '', bold: true },
    //   { text: '', bold: true },
    //   { text: 'Head of the Department', bold: true },
    // ];

    // summaryTableData.push(signatures);


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
              width: 500,
              alignment: 'center', // Adjust the width as needed
          },
          footer: {
            image: this.state.footerImageDataURL, // Use the data URL from state
            width: 400,
            alignment: 'center', // Adjust the width as needed
        },
          content: [
            {
              text: `Department of ${dept}`,
              fontSize: 14,
              bold: true,
              margin: [10, 10, 40, 10],
              alignment: 'center', // Adjust the width as needed
              
            },
            {
              text: `Session:${session}`,
              fontSize: 12,
              bold: true,
              margin: [10, 10, 40, 10],
              alignment: 'center', // Adjust the width as needed
              
            },
            {
              table: {
                // alignment: 'justify',
                // widths: [70, 60, 60, 60, 60, 60, 60, 60, 60], // Adjust the column widths as needed
                body: tableData,
                alignment: 'center'
              },
            },
            {
              text: 'Summary:',
              fontSize: 12,
              bold: true,
              margin: [0, 10, 40, 10],
              alignment: 'left',
            },
            {
              table: {
                fontSize: 10,
                body: summaryTableData,
                alignment: 'center',
              },
            },
            {
            table: {
              widths: ['*', '*'], // Two equal-width columns
              body: [
                [
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
                    // margin: [10,10,10,10],
                  },
                ],
              ],
            },
            layout: 'noBorders',
            margin: [0,30,0,0],
          },


            ],
         

        };
    
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
