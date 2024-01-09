import Bottom from './Bottom';
import Content from './Content';
import Top from './Top';

const data = {
  logos: [''],
  header: [''],
  body: '',
  footer: [''],
  signs: [
    {
      name: 'Kiana Kutch',
      position: 'sequi',
      url: 'https://placehold.co/200x100',
    },
    {
      name: 'Carleton Wehner',
      position: 'nisi',
      url: 'https://placehold.co/200x100',
    },
    {
      name: 'Lora Runolfsson',
      position: 'ut',
      url: 'https://placehold.co/200x100',
    },
    {
      name: 'Orville Bosco',
      position: 'quia',
      url: 'https://placehold.co/200x100',
    },
    {
      name: 'Prof. Easton Breitenberg',
      position: 'voluptatem',
      url: 'https://placehold.co/200x100',
    },
  ],
  certiType: '',
};

function Template03() {
  return (
    <>
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 1122.52 793.7"
        id="svg"
      >
        <Top />
        <Content name={data.name} />
        <Bottom signs={data.signs} />
      </svg>
    </>
  );
}

export default Template03;
