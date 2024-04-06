import React from 'react'
import CertificateContent from './certificatetemplates/template01'
import Template03 from './certificatetemplates/03_sarthak'
import Template04 from './certificatetemplates/harshvardhan01'
import Template05 from './certificatetemplates/Ankit01'


function SelectCertficate(
    {

        templateId,
        eventId,
        contentBody,
        certiType,
        logos,
        participantDetail,
        signature,
        header,
        footer,
    }
) {
    const certiDesignTemp = [
        <CertificateContent eventId={eventId} contentBody={contentBody} certiType={certiType} logos={logos} participantDetail={participantDetail} signature={signature} header={header} footer={footer} key={"0"} />,
        <Template04 eventId={eventId} contentBody={contentBody} certiType={certiType} logos={logos} participantDetail={participantDetail} signature={signature} header={header} footer={footer} key={"1"} />,
        <Template03 eventId={eventId} contentBody={contentBody} certiType={certiType} logos={logos} participantDetail={participantDetail} signature={signature} header={header} footer={footer} key={"2"} />,
        <Template05 eventId={eventId} contentBody={contentBody} certiType={certiType} logos={logos} participantDetail={participantDetail} signature={signature} header={header} footer={footer} key={"3"} />
    ]

    return (
        <div>
            {certiDesignTemp[templateId]}
        </div>
    )
}

export default SelectCertficate