function Bottom({ signs }) {
  console.log(signs);
  return (
    <>
      {/* <path fill="#1E0C45" d={`M180 600h90.476v2.07H180Z`} />
            <p className="tw-text-black"> {Signature}</p> */}
      <foreignObject x={180} y={600} width={600} height={200}>
        <div className="tw-flex">
          {signs.map((item, key) => (
            <div
              key={key}
              className="tw-flex tw-flex-col tw-items-center tw-justify-center tw-gap-2"
            >
              <img src={item.url} alt="" />
              <hr className="tw-bg-black tw-border-black" />
              <p className="tw-text-black tw-text-lg">{item.name}</p>
              <p className="tw-text-black">{item.position}</p>
            </div>
          ))}
        </div>
      </foreignObject>
    </>
  );
}

export default Bottom;
