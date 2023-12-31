import { coreTeam, faculty } from '../../../constants/members';
import Team from './Team';

const TeamSection = () => {
  return (
    <>
      <Team
        title="Core Team"
        desp="Xceed has an experienced team of developers, designers and mentors
            dedicated to create web solutions based on your requirement."
        teamData={coreTeam}
        variant="core"
      />
      <Team
        title="Faculty Coordinators"
        desp="Faculty Coordinators are the backbone of Xceed. They are the ones
            who guide us and help us in every possible way."
        teamData={faculty}
        variant="faculty"
      />
      {/* <FacultyCoordinators /> */}
    </>
  );
};

export default TeamSection;
