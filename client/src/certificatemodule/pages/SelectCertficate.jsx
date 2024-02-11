import React from 'react'
import CertificateContent from './certificatetemplates/template01'
import Template03 from './certificatetemplates/03_sarthak'
import Template04 from './certificatetemplates/harshvardhan01'


function SelectCertficate(
    {
        certiDesign,
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
    const certiDesignTemp = {
        component: <CertificateContent eventId={eventId} contentBody={contentBody} certiType={certiType} logos={logos} participantDetail={participantDetail} signature={signature} header={header} footer={footer} />,

        component2: <Template04 eventId={eventId} contentBody={contentBody} certiType={certiType} logos={logos} participantDetail={participantDetail} signature={signature} header={header} footer={footer} />,
        component3: <Template03 />
    }

    return (
        <div>
            {certiDesignTemp.component2}
        </div>
    )
}

export default SelectCertficate