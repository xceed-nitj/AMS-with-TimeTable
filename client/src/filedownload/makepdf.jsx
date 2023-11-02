import React from 'react';
import * as pdfMake from 'pdfmake/build/pdfmake';
import * as pdfFonts from 'pdfmake/build/vfs_fonts';

// (pdfMake as any).vfs = pdfFonts.pdfMake.vfs;

import header from '../assets/header.png'
import footer from '../assets/footer.png'; // Replace with the actual path to your footer image


pdfMake.vfs = pdfFonts.pdfMake.vfs;

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
              width: 400,
              alignment: 'center', // Adjust the width as needed
          },
          footer: {
            image: this.state.footerImageDataURL, // Use the data URL from state
            width: 400,
            alignment: 'center', // Adjust the width as needed
        },
          content: [
            {
              text: 'hi',
              fontSize: 16,
              bold: true,
              margin: [40, 70, 40, 10],
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
            
          ],
         

        };
    
        pdfMake.createPdf(documentDefinition).open();
      });
    };
  };

  render() {
    return (
      <div>
        <button onClick={this.generatePDF}>Generate PDF</button>
      </div>
    );
  }
}

export default PDFGenerator;
