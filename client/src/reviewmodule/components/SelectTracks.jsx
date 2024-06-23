import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import getEnvironment from "../../getenvironment";
import { Select, FormControl, FormLabel } from '@chakra-ui/react';

function SelectTracks() {
  const apiUrl = getEnvironment();
  const { eventId } = useParams();
  const [tracks, setTracks] = useState([]);

  useEffect(() => {
    const fetchTracks = async () => {
      try {
        const response = await axios.get(`${apiUrl}/reviewmodule/event/getEvents/${eventId}`);
        setTracks(response.data.tracks || []);
      } catch (error) {
        console.error('Error fetching tracks:', error);
        setTracks([]);
      }
    };

    fetchTracks();
  }, [apiUrl, eventId]);

  return (
    <FormControl>
    <FormLabel>Tracks:</FormLabel>
    <Select placeholder="Select a track">
    {tracks.length > 0 ? (
        tracks.map((track, index) => (
          <option key={index} value={track}>
            {track}
          </option>
        ))
      ) : (
        <option disabled>No tracks available</option>
      )}
    </Select>
    </FormControl>
  );
}

export default SelectTracks;
