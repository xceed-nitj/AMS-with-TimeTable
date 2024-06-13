import React from 'react';
import CertificateContent from './certificatetemplates/basic01';
import Template02 from './certificatetemplates/basic02';
import Template03 from './certificatetemplates/03_sarthak';

import Template04 from './certificatetemplates/basic04';
import Template05 from './certificatetemplates/basic05';
import Template06 from './certificatetemplates/basic06';
import Template07 from './certificatetemplates/basic07';
import Template08 from './certificatetemplates/basic08';
import Template09 from './certificatetemplates/basic09';
import Template10 from './certificatetemplates/premium01';
import Template11 from './certificatetemplates/premium02';
import Template12 from './certificatetemplates/premium03';
import Template13 from './certificatetemplates/premium04';
import Template14 from './certificatetemplates/basic11';


function SelectCertficate({
  templateId,
  eventId,
  contentBody,
  certiType,
  logos,
  participantDetail,
  signature,
  header,
  footer,
}) {
  const certiDesignTemp = [
    <CertificateContent
      eventId={eventId}
      contentBody={contentBody}
      certiType={certiType}
      logos={logos}
      participantDetail={participantDetail}
      signature={signature}
      header={header}
      footer={footer}
      key={'0'}
    />,
    <Template02
      eventId={eventId}
      contentBody={contentBody}
      certiType={certiType}
      logos={logos}
      participantDetail={participantDetail}
      signature={signature}
      header={header}
      footer={footer}
      key={'1'}
    />,
    <Template03
      eventId={eventId}
      contentBody={contentBody}
      certiType={certiType}
      logos={logos}
      participantDetail={participantDetail}
      signature={signature}
      header={header}
      footer={footer}
      key={'2'}
    />,
    <Template04
      eventId={eventId}
      contentBody={contentBody}
      certiType={certiType}
      logos={logos}
      participantDetail={participantDetail}
      signature={signature}
      header={header}
      footer={footer}
      key={'3'}
    />,
    <Template05
      eventId={eventId}
      contentBody={contentBody}
      certiType={certiType}
      logos={logos}
      participantDetail={participantDetail}
      signature={signature}
      header={header}
      footer={footer}
      key={'4'}
    />,
    <Template06
      eventId={eventId}
      contentBody={contentBody}
      certiType={certiType}
      logos={logos}
      participantDetail={participantDetail}
      signature={signature}
      header={header}
      footer={footer}
      key={'5'}
    />,
    <Template07
      eventId={eventId}
      contentBody={contentBody}
      certiType={certiType}
      logos={logos}
      participantDetail={participantDetail}
      signature={signature}
      header={header}
      footer={footer}
      key={'6'}
    />,
    <Template08
      eventId={eventId}
      contentBody={contentBody}
      certiType={certiType}
      logos={logos}
      participantDetail={participantDetail}
      signature={signature}
      header={header}
      footer={footer}
      key={'7'}
    />,

    <Template09
      eventId={eventId}
      contentBody={contentBody}
      certiType={certiType}
      logos={logos}
      participantDetail={participantDetail}
      signature={signature}
      header={header}
      footer={footer}
      key={'8'}
    />,
    <Template10
      eventId={eventId}
      contentBody={contentBody}
      certiType={certiType}
      logos={logos}
      participantDetail={participantDetail}
      signature={signature}
      header={header}
      footer={footer}
      key={'9'}
    />,
    <Template11
      eventId={eventId}
      contentBody={contentBody}
      certiType={certiType}
      logos={logos}
      participantDetail={participantDetail}
      signature={signature}
      header={header}
      footer={footer}
      key={'10'}
    />,
    <Template12
      eventId={eventId}
      contentBody={contentBody}
      certiType={certiType}
      logos={logos}
      participantDetail={participantDetail}
      signature={signature}
      header={header}
      footer={footer}
      key={'11'}
    />,
    <Template13
      eventId={eventId}
      contentBody={contentBody}
      certiType={certiType}
      logos={logos}
      participantDetail={participantDetail}
      signature={signature}
      header={header}
      footer={footer}
      key={'12'}
    />,

    <Template14
      eventId={eventId}
      contentBody={contentBody}
      certiType={certiType}
      logos={logos}
      participantDetail={participantDetail}
      signature={signature}
      header={header}
      footer={footer}
      key={'13'}
    />,

  ];

  return <div>{certiDesignTemp[templateId]}</div>;
}

export default SelectCertficate;
