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
        title="Faculty Mentors"
        desp="People behind the XCEED!"
        teamData={faculty}
        variant="faculty"
      />
      {/* <FacultyCoordinators /> */}
    </>
  );
};

export default TeamSection;
