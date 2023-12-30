import SectionHeader from '../../ui/home/SectionHeader';
import TeamCard from './TeamCard';
import { faculty } from '../../../constants/coreTeam';

const FacultyCoordinators = () => {
  return (
    <section id="team" className="tw-bg-gray-900">
      <div className="tw-py-8 tw-px-4 tw-mx-auto tw-max-w-screen-xl sm:tw-py-16 lg:tw-px-6">
        <div className="tw-font-light tw-text-gray-500 sm:tw-text-lg dark:tw-text-gray-400 tw-mx-auto  lg:tw-w-1/2 tw-text-center tw-mt-10 tw-mb-4">
          <SectionHeader title="Faculty Coordinators" centered />
          <p className="tw-mb-8">
            Faculty Coordinators are the backbone of Xceed. They are the ones
            who guide us and help us in every possible way.
          </p>
        </div>
        <div className="tw-grid tw-grid-cols-1 sm:tw-grid-cols-2 tw-justify-center tw-gap-4 lg:tw-gap-8 tw-max-w-4xl tw-mx-auto">
          {faculty.map((member) => (
            <TeamCard
              key={member.id}
              variant="faculty"
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

export default FacultyCoordinators;
