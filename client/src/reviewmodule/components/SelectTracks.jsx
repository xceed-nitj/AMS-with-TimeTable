import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import getEnvironment from "../../getenvironment";
import { Select, FormControl, FormLabel } from '@chakra-ui/react';
import { useRecoilState } from 'recoil';
import { paperState } from '../state/atoms/paperState';

function SelectTracks() {
  const [paper, setPaper] = useRecoilState(paperState);
  const apiUrl = getEnvironment();
  const { eventId } = useParams();
  const [tracks, setTracks] = useState([]);
  const selectedTracks = [];
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
  const handleTrackChange = (track) => {
    selectedTracks.push(track);
    setPaper((prevPaper) => ({
      ...prevPaper,
      tracks: selectedTracks,
    }));
  };
  return (
    <FormControl>
    <FormLabel>Tracks:</FormLabel>
    <Select placeholder="Select a track"
    onChange={(e) => handleTrackChange(e.target.value)}
    >
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
