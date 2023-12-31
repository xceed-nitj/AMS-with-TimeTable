import SectionHeader from '../../ui/home/SectionHeader';
import TeamCard from './TeamCard';

const Team = ({ title, desp, teamData, variant }) => {
  if (!teamData) {
    return null;
  }

  return (
    <section id="team" className="tw-bg-gray-900">
      <div className="tw-py-8 tw-px-4 tw-mx-auto tw-max-w-screen-xl sm:tw-py-16 lg:tw-px-6">
        <div className="tw-font-light tw-text-gray-500 sm:tw-text-lg dark:tw-text-gray-400 tw-mx-auto  lg:tw-w-1/2 tw-text-center tw-mb-4">
          <SectionHeader title={title} centered />
          <p className="tw-mb-8">{desp}</p>
        </div>
        {typeof teamData === 'string' ? (
          <p className="tw-text-center">
            Check out the people involved in this project <br />
            <a
              href={teamData}
              target="_blank"
              rel="noreferrer"
              className="tw-text-cyan-600 dark:tw-text-cyan-300 hover:tw-underline tw-text-xl tw-font-bold my-5 tw-block"
            >
              here
            </a>
          </p>
        ) : (
          <div className="tw-grid tw-grid-cols-1 sm:tw-grid-cols-2 lg:tw-grid-cols-3 tw-justify-center tw-gap-4 lg:tw-gap-8">
            {teamData.map((member) => (
              <TeamCard
                key={member.id}
                name={member.name}
                designation={member.designation}
                image={member.image}
                github={member.github}
                linkedin={member.linkedin}
                variant={variant}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

export default Team;
