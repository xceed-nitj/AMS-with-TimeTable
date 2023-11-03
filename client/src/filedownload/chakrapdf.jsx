import React from 'react';
import {
  Document,
  Page,
  View,
  Text as PdfText,
  StyleSheet,
} from '@react-pdf/renderer';


// Define a Chakra UI theme using ChakraProvider
const ChakraPDFDocument = ({ children }) => (
  <ChakraProvider>{children}</ChakraProvider>
);

// Define a Chakra UI style for the PDF
const styles = StyleSheet.create({
  container: {
    padding: 10,
    fontFamily: 'Arial',
  },
  table: {
    width: '100%',
    border: '1px solid #000',
  },
  row: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#000',
  },
  cell: {
    flex: 1,
    padding: 5,
    fontSize: 12,
  },
  headerCell: {
    backgroundColor: '#eee',
    fontWeight: 'bold',
  },
});



const PDFViewTimetable = ({ timetableData }) => {
  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

  return (
    <Document>
      <Page style={styles.container} size="A4" orientation="landscape">
        <View style={styles.table}>
          <View style={styles.row}>
            <PdfText style={[styles.cell, styles.headerCell]}>Day/Period</PdfText>
            {[1, 2, 3, 4, 5, 6, 7, 8].map((period) => (
              <PdfText key={period} style={[styles.cell, styles.headerCell]}>
                {period}
              </PdfText>
            ))}
          </View>
          
          {/* ... (rest of your code) */}
        </View>
      </Page>
    </Document>
  );
};
export default PDFViewTimetable;
