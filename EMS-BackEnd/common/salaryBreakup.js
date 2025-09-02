// export function calculateSalaryBreakup(yearlySalary) {
//   const monthlyGross = yearlySalary / 12;

//   const basic = monthlyGross * 0.4; // 40% of CTC
//   const hra = basic * 0.5; // 50% of Basic
//   const conveyance = 1600; // Fixed
//   const specialAllowance = monthlyGross - (basic + hra + conveyance);

//   const pf = Math.min(basic * 0.12, 1800); // capped at 1800
//   const professionalTax = monthlyGross > 15000 ? 200 : 0;

//   const monthlyNet = monthlyGross - (pf + professionalTax);

//   return {
//     monthlyGross: parseFloat(monthlyGross.toFixed(2)),
//     basic: parseFloat(basic.toFixed(2)),
//     hra: parseFloat(hra.toFixed(2)),
//     conveyance: parseFloat(conveyance.toFixed(2)),
//     specialAllowance: parseFloat(specialAllowance.toFixed(2)),
//     pf: parseFloat(pf.toFixed(2)),
//     professionalTax,
//     monthlyNet: parseFloat(monthlyNet.toFixed(2)),
//   };
// }

// export function calculateSalaryBreakup(yearlySalary) {
//   const monthlyGross = yearlySalary / 12;

//   // Components (monthly earnings)
//   const basic = monthlyGross * 0.4; // 40% of Gross
//   const hra = basic * 0.5; // 50% of Basic
//   const specialAllowance = monthlyGross - (basic + hra);

//   // Deductions (monthly)
//   const pf = Math.min(basic * 0.12, 1800); // PF capped at 1800
//   const professionalTax = monthlyGross > 15000 ? 200 : 0;
//   const otherAllowance = 1500; // Example fixed deduction

//   // Total deduction (monthly)
//   const totalDeduction = pf + professionalTax;

//   // Monthly net
//   const monthlyNet = monthlyGross - (pf + professionalTax);

//   return {
//     monthly: {
//       gross: Math.round(monthlyGross),
//       basic: Math.round(basic),
//       hra: Math.round(hra),
//       specialAllowance: Math.round(specialAllowance),
//       pf: Math.round(pf),
//       professionalTax: Math.round(professionalTax),
//       otherAllowance: Math.round(otherAllowance),
//       totalDeductions: Math.round(totalDeduction),
//       net: Math.round(monthlyNet),
//     },
//     yearly: {
//       gross: Math.round(yearlySalary),
//       basic: Math.round(basic * 12),
//       hra: Math.round(hra * 12),
//       specialAllowance: Math.round(specialAllowance * 12),
//       pf: Math.round(pf * 12),
//       professionalTax: Math.round(professionalTax * 12),
//       otherAllowance: Math.round(otherAllowance * 12),
//       totalDeductions: Math.round(totalDeduction * 12),
//       net: Math.round(monthlyNet * 12),
//     },
//   };
// }

export function calculateSalaryBreakup(yearlySalary) {
  const monthlyGross = yearlySalary / 12;

  // Monthly earnings
  const basic = monthlyGross * 0.4;
  const hra = basic * 0.5;
  const specialAllowance = monthlyGross - (basic + hra);

  // PF Contributions
  const employeePF = basic * 0.12;
  const employerEPF = basic * 0.0367;
  const employerEPS = Math.min(basic, 15000) * 0.0833;
  const totalEmployerPF = employerEPF + employerEPS;

  // Other deductions
  const professionalTax = monthlyGross > 15000 ? 200 : 0;
  const otherAllowance = 1500;

  // Total deductions
  const totalDeduction = employeePF + professionalTax + totalEmployerPF;
  const monthlyNet = monthlyGross - totalDeduction;

  return {
    monthly: {
      gross: Math.round(monthlyGross),
      basic: Math.round(basic),
      hra: Math.round(hra),
      specialAllowance: Math.round(specialAllowance),
      pf: Math.round(employeePF),
      professionalTax: Math.round(professionalTax),
      otherAllowance: Math.round(otherAllowance),
      totalDeductions: Math.round(totalDeduction),
      net: Math.round(monthlyNet),
      employerContribution: {
        epf: Math.round(employerEPF),
        eps: Math.round(employerEPS),
        total: Math.round(totalEmployerPF),
      },
    },
    yearly: {
      gross: Math.round(yearlySalary),
      basic: Math.round(basic * 12),
      hra: Math.round(hra * 12),
      specialAllowance: Math.round(specialAllowance * 12),
      pf: Math.round(employeePF * 12),
      professionalTax: Math.round(professionalTax * 12),
      otherAllowance: Math.round(otherAllowance * 12),
      totalDeductions: Math.round(totalDeduction * 12),
      net: Math.round(monthlyNet * 12),
      employerContribution: {
        epf: Math.round(employerEPF * 12),
        eps: Math.round(employerEPS * 12),
        total: Math.round(totalEmployerPF * 12),
      },
    },
  };
}
