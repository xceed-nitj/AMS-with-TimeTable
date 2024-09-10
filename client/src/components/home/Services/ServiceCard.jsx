import { Link } from "react-router-dom";

const ServiceCard = ({ id, icon, title, description, price }) => {
  return (
    <div className="tw-flex-shrink-0 tw-p-5 tw-w-full">
      <div className="tw-flex tw-justify-center tw-items-center tw-mb-4 tw-w-10 tw-h-10 tw-rounded-full lg:tw-h-12 lg:tw-w-12 tw-bg-cyan-900 *:tw-w-5 *:tw-h-5 tw-text-cyan-600 lg:*:tw-w-6 lg:*:tw-h-6 dark:tw-text-cyan-300">
        {icon}
      </div>
      
      <h3 className="tw-font-bold tw-w-full dark:tw-text-white tw-text-[24px]">{title}</h3>
      <p className="tw-text-gray-500  tw-text-justify text-[16px] tw-text-[16px] dark:tw-text-gray-400 tw-line-clamp-4">
        {description}
      </p>
      <span>
          <Link to={`/services/${id}`} className="tw-text-cyan-600 dark:tw-text-cyan-300">
            {" "}
            Read more...
          </Link>
      </span>
      
      <p className="tw-flex tw-items-end tw-py-[10px] tw-flex-grow tw tw-font-bold tw-text-cyan-600 dark:tw-text-cyan-300 tw-italic ">
        {price}
      </p>
    </div>
  );
};

export default ServiceCard;
