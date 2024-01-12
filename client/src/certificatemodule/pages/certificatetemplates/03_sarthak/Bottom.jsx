
function Bottom({ signature }) {
    return (
        <>
            {/* <path fill="#1E0C45" d={`M180 600h90.476v2.07H180Z`} />
            <p className="tw-text-black"> {Signature}</p> */}
            <foreignObject x={170} y={550} width={800} height={200}>
                <div className="tw-flex tw-items-center tw-justify-between ">
                    {signature.map((item, key) => (
                        <div
                            key={key}
                            className="tw-flex tw-flex-col tw-items-center tw-justify-center tw-gap-2 "
                        >
                            <div className="tw-w-[100px]" ><img  src={item.url} alt="" /></div>
                            <hr className="tw-bg-black tw-rounded-xl tw-p-[1px] tw-w-[100px]" />
                            <p className="tw-text-black tw-text-[15px]">{item.name}</p>
                            <p className="tw-text-black tw-text-[13px] ">{item.position}</p>
                        </div>
                    ))}
                </div>
            </foreignObject>
        </>
    );
}

export default Bottom;
