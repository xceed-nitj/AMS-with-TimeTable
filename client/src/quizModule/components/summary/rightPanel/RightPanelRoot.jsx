import React from 'react';
import PropTypes from 'prop-types';
import PlacementQuizPanel from "./PlacementQuizPanel.jsx";
import SubjectiveQuizPanel from "./SubjectiveQuizPanel.jsx";
import YourBooksPanel from "./YourBooksPanel.jsx";
import YourCollectionsPanel from "./YourCollectionsPanel.jsx";

const RightPanelRoot = (props) => {
    const isValid = (route) => {
        return route !== undefined && route !== null && componentMap[route] !== undefined;
    }
    const summaryLink = props.summaryLink;
    const componentMap = {
        'placement-quiz': <PlacementQuizPanel/>,
        'subjective-quiz': <SubjectiveQuizPanel/>,
        'your-books': <YourBooksPanel/>,
        'your-collections': <YourCollectionsPanel/>
    };

    return (
        <div className='panel'>
            {isValid(summaryLink) ? componentMap[summaryLink] : <SubjectiveQuizPanel/>}
        </div>
    );
};

RightPanelRoot.propTypes = {
    summaryLink: PropTypes.string
};

export default RightPanelRoot;
