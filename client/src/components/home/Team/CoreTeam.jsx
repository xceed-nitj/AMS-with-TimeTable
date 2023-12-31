import SectionHeader from '../../ui/home/SectionHeader';
import TeamCard from './TeamCard';
import { coreTeam } from '../../../constants/coreTeam';

const CoreTeam = () => {
  return (
    <section id="team" className="tw-bg-gray-900">
      <div className="tw-py-8 tw-px-4 tw-mx-auto tw-max-w-screen-xl sm:tw-py-16 lg:tw-px-6">
        <div className="tw-font-light tw-text-gray-500 sm:tw-text-lg dark:tw-text-gray-400 tw-mx-auto  lg:tw-w-1/2 tw-text-center tw-mb-4">
          <SectionHeader title="Our Core Team" centered />
          <p className="tw-mb-8">
            XCEED has an experienced team of developers, designers and mentors
            dedicated to create web solutions based on your requirement.
          </p>
        </div>
        <div className="tw-grid tw-grid-cols-1 sm:tw-grid-cols-2 lg:tw-grid-cols-3 tw-justify-center tw-gap-4 lg:tw-gap-8">
          {coreTeam.map((member) => (
            <TeamCard
              key={member.id}
              name={member.name}
              designation={member.designation}
              image={member.image}
              github={member.github}
              linkedin={member.linkedin}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

export default CoreTeam;
