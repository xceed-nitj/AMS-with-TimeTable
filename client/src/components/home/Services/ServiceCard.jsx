import { Link } from "react-router-dom";

const ServiceCard = ({ id, icon, title, description, price }) => {
  return (
    <div className="tw-flex-shrink-0 tw-p-5 tw-w-full md:tw-w-48 lg:tw-w-64 sm:tw-w-32">
      <div className="tw-flex tw-justify-center tw-items-center tw-mb-4 tw-w-10 tw-h-10 tw-rounded-full lg:tw-h-12 lg:tw-w-12 tw-bg-cyan-900 *:tw-w-5 *:tw-h-5 tw-text-cyan-600 lg:*:tw-w-6 lg:*:tw-h-6 dark:tw-text-cyan-300">
        {icon}
      </div>
      <h3 className="tw-font-bold tw-w-full dark:tw-text-white md:tw-text-[16px] xl:tw-text-[24px] lg:tw-text-[20px] sm:tw-text-[12px]">{title}</h3>
      <p className="tw-text-gray-500  tw-text-justify text-[16px] sm:tw-text-[12px] md:tw-text-[16px] lg:tw-text-[16px] xl:tw-text-[16px] dark:tw-text-gray-400 tw-line-clamp-4 md:tw-text-[10px] xl:tw-text-[16px] sm:tw-text-[8px]">
        {description}
      </p>
      <span>
          <Link to={`/services/${id}`} className="tw-text-cyan-600 dark:tw-text-cyan-300 md:tw-text-[16px] xl:tw-text-[16px]  sm:tw-text-[8px]">
            {" "}
            Read more...
          </Link>
        </span>
      <p className="tw-flex tw-items-end tw-py-[10px] tw-flex-grow tw tw-font-bold tw-text-cyan-600 dark:tw-text-cyan-300 tw-italic md:tw-text-[16px] xl:tw-text-[16px] sm:tw-text-[8px]">
        {price}
      </p>
    </div>
  );
};

export default ServiceCard;
