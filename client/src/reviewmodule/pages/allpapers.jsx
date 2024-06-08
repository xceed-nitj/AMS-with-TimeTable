import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom"; // Import Link
import getEnvironment from "../../getenvironment";
import {
  Container,
  Box,
  Input,
  Button,
  VStack,
  Textarea,
} from "@chakra-ui/react";
import { FormControl, FormLabel } from "@chakra-ui/react";
import { useToast } from "@chakra-ui/react";
import Header from "../../components/header";

function EventPaper() {
  let arrayDataItems=[];
  let papers=[];
  let status_to_show=false;
  /*const [papers, setPaper] = useState([]);*/
  const apiUrl = getEnvironment();
  const navigate = useNavigate();
  const currentURL = window.location.pathname;
  const parts = currentURL.split("/");
  const eventId = parts[parts.length - 3];

  useEffect(() => {
    const fetchPapersById = async () => {
      try {
        const response = await fetch(
          `${apiUrl}/api/v1/reviewmodule/paper/${eventId}`,
          {
            method: "GET",
            credentials: "include",
          }
        );
        if(response.ok)
        {
        const data = await response.json();
        console.log("this is data:",data);
        papers = await [...data];
        console.log("this is papers:",papers);
        arrayDataItems = await papers.map((paper) => <li>{paper}</li>);
        console.log("this is arraydata:",arrayDataItems);
      }
      } catch (error) {
        console.error("Error fetching papers:", error);
      }
    };
    fetchPapersById();
  }, [apiUrl, eventId]);
}

export default EventPaper;
