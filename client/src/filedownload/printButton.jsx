import React, { useRef } from "react";
import { useReactToPrint } from "react-to-print";
import PrintableComponent from "./printChakra";
import { CustomBlueButton } from "../styles/customStyles";

const PrintButton = () => {
  const componentRef = useRef();
  const handlePrint = useReactToPrint({
    content: () => componentRef.current,
  });

  return (
    <div>
      <CustomBlueButton onClick={handlePrint}>Print to PDF</CustomBlueButton>
      <PrintableComponent ref={componentRef} />
    </div>
  );
};

export default PrintButton;
