import React from 'react';

function Signature({ x, y, name, imageUrl }) {
    return (
        <>
            <image
                x={x}
                y={y}
                href={imageUrl}
                width="100"
                height="30"
            />
            <path fill="#1E0C45" d={`M${x} ${(y+35)}h90.476v2.07H${x}Z`} />
            <text
                x={x+10}
                y={y + 60}  // Adjust the y-coordinate for the name
                fill="#272727"
                fontFamily="AbhayaLibre-Regular"
                fontSize={20}
            >
                {name}
            </text>
        </>
    );
}

function Bottom() {
    // Array of signature (database example)
    const signatures = [    //MAX 7 signatures
        { imageUrl: 'url1.jpg', name: 'sarthak' },
        { imageUrl: 'url2.jpg', name: 'John Doe' },
        { imageUrl: 'url1.jpg', name: 'sarthak' },
        { imageUrl: 'url2.jpg', name: 'John Doe' },
        { imageUrl: 'url1.jpg', name: 'sarthak' },
        { imageUrl: 'url2.jpg', name: 'John Doe' },
        { imageUrl: 'url1.jpg', name: 'sarthak' },
        // Add more signature configurations as needed
    ];

    // Calculate x and y coordinates dynamically
    const calculateCoordinates = (index) => {
        const x = 180 + index * 120;  
        const y = 600 ;
        return { x, y };
    };

    return (
        <>
            {signatures.map((signature, index) => {
                const { x, y } = calculateCoordinates(index);
                return <Signature key={index} x={x} y={y} {...signature} />;
            })}
        </>
    );
}

export default Bottom;
