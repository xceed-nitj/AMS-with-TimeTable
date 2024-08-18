import { atom } from 'recoil';
export const paperState = atom({
  key: 'paperState', // unique ID (with respect to other atoms/selectors)
  default: {
    pid:'',
    eventId: '',
    authors: [],
    pseudo_authors: [],
    title: '',
    tracks:[],
    abstract: '',
    codeUploads: [],
    paperUploads: [],
    terms: false,
  }, // default value (aka initial value)
});
