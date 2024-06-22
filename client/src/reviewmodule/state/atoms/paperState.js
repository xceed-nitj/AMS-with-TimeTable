import { atom } from 'recoil';
var url = window.location.href;
var urlParts = url.split('/');
var value1 = urlParts[4];
export const paperState = atom({
  key: 'paperState', // unique ID (with respect to other atoms/selectors)
  default: {
    eventId: value1,
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
