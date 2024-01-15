import Bottom from './Bottom'
import Content from './Content'
import Top from './Top'

const data = {
    logos: [
        {
            name: 'Kiana Kutch',
            position: 'sequi',
            url: 'https://placehold.co/200x200',
        },
        {
            name: 'Carleton Wehner',
            position: 'nisi',
            url: 'https://placehold.co/200x200',
        },
        {
            name: 'Lora Runolfsson',
            position: 'ut',
            url: 'https://placehold.co/200x200',
        },

        {
            name: 'Orville Bosco',
            position: 'quia',
            url: 'https://placehold.co/200x200',
        },
        {
            name: 'Orville Bosco',
            position: 'quia',
            url: 'https://placehold.co/200x200',
        },
    ],
    header: ["CERTIFICATE", "OF ACHIEVEMENT"],
    participant: ["Sarthak Sharma"],
    body: 'of team BLACK PANTHER from the department CSE has won the "1st PRIZE" in PixelPerfect Event, an internal design held from 13 June,2023 to 1st July,2023 organized by Website Development & management Club.',
    footer: [''],
    signature: [

        {
            name: 'Kiana Kutch',
            position: 'sequi',
            url: 'https://placehold.co/400x200',
        },
        {
            name: 'Kiana Kutch',
            position: 'sequi',
            url: 'https://placehold.co/400x200',
        },

        {
            name: 'Carleton Wehner',
            position: 'nisi',
            url: 'https://placehold.co/400x200',
        },
        {
            name: 'Lora Runolfsson',
            position: 'ut',
            url: 'https://placehold.co/400x200',
        },
        {
            name: 'Orville Bosco rville Bosco rville Bosco',
            position: 'quia',
            url: 'https://placehold.co/400x200',
        },
        {
            name: 'Prof. Easton Breitenberg',
            position: 'voluptatem',
            url: 'https://placehold.co/400x200',
        },
    ],
    certiType: ['1st', 'Prize'],
};


function Template03() {
    // console.log(certificateData.Signature);
    return (
        <>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1122.52 793.7" id="svg">
                <Top logos={data.logos} />
                <Content header={data.header} body={data.body} name={data.participant} certiType={data.certiType} />
                <Bottom signature={data.signature} />
            </svg>


        </>
    )
}

export default Template03
