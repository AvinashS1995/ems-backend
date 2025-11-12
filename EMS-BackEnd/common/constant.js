export const ROLE = {
  MANAGER: "Manager",
  TEAM_LEADER: "Team Leader",
  EMPLOYEE: "Employee",
  HR: "HR",
};

export const ROLE_ID = {
  [ROLE.MANAGER]: 1,
  [ROLE.TEAM_LEADER]: 2,
  [ROLE.EMPLOYEE]: 3,
  [ROLE.HR]: 4,
};

export const PASSWORD_PATTERN_REGEX =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
