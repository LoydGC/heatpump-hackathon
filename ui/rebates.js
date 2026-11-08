// Rebate explainer content (plain language) per region + generic "where rebates come from".
// ALL FIGURES ARE SNAPSHOTS from official/utility pages read on 2026-11-07 (or from data.zip for Minneapolis).
// Programs change often; the UI tells users to verify. Links marked checked:true were opened on 2026-11-07.
// Owner: UI (content), Data (should replace with a verified rebates pack per region). See docs/INTERFACES.md.
(function () {
  const SOURCES = [
    { key: "federal", title: "Federal government", p: "Income-tax credits and national rebate programs. In the US the 25C tax credit (30% back, up to $2,000 a year for a heat pump) ended for equipment installed after Dec 31, 2025. The IRA home energy rebates (HOMES and HEEHR) are paid out through each state, not by you to the IRS, and the rules have been changing. In Canada the federal Greener Homes Grant is closed to new applicants." },
    { key: "state", title: "State or province", p: "Programs run by state energy offices or provincial agencies, often income-based and often paid through your state's rollout of the federal rebates. Some are launched late or paused when money runs out." },
    { key: "utility", title: "Your electric or gas utility", p: "Usually the biggest and most dependable rebate. Utilities are required or choose to fund efficiency because it is cheaper than building new power plants. Amounts depend on which utility serves you and what you heat with today." },
    { key: "local", title: "City, county or co-op", p: "Smaller programs: municipal cost-share, community-owned electric co-ops, and income-targeted neighborhood programs. Worth a phone call to your city or co-op." },
    { key: "maker", title: "Manufacturer and contractor promos", p: "Seasonal discounts, free thermostats or extended warranties. They change monthly, and a contractor's quote may already include them, so ask what is in the price." }
  ];

  const FED_US = [
    { name: "Federal 25C tax credit", level: "Federal", status: "ended", amount: "$0 for 2026 installs",
      note: "Covered heat pumps installed through Dec 31, 2025.",
      url: "https://www.irs.gov/credits-deductions/energy-efficient-home-improvement-credit", checked: true },
    { name: "IRA home energy rebates (HOMES / HEEHR)", level: "Federal, paid by your state", status: "unclear", amount: "Varies by state and income",
      note: "Trade press reports DOE guidance in 2026 stopped these rebates from paying for switching from gas, oil or propane to a heat pump, and many states had not launched them. Ask your state energy office.",
      url: "https://www.energy.gov/scep/home-energy-rebates-programs", checked: true }
  ];

  const REGION = {
    boston: {
      intro: "In Massachusetts, most of the money comes from Mass Save, funded through utility bills and run with your electric and gas utility.",
      programs: [
        { name: "Mass Save heat pump rebate", level: "Utility / state", status: "open",
          amount: "Whole-home: $2,650 per ton, up to $8,500. Partial-home (keep your boiler or furnace): $1,125 per ton, up to $8,500, plus $500 for weatherization and $500 for correct sizing. Income-qualified households: up to $16,000 or no-cost install. Amounts drop for 2027 installs.",
          note: "Needs an ENERGY STAR cold-climate model from the qualified list, installed by a Mass Save Heat Pump Installer Network contractor. Paperwork due Feb 28, 2027 for 2026 installs.",
          url: "https://www.masssave.com/save/heating-and-water-heating", checked: true },
        { name: "Mass Save 0% HEAT Loan", level: "Utility / state", status: "open", amount: "0% financing up to $25,000",
          note: "Can cover the part of the cost the rebate does not.", url: "https://www.masssave.com/save/heating-and-water-heating", checked: true }
      ].concat(FED_US),
      paperwork: ["Mass Save account number or a recent utility bill", "Proof of your current heating fuel", "Home Energy Assessment report (for the weatherization bonus or whole-home eligibility)", "Installer's heating load calculation (for the sizing bonus)", "Photo of the outdoor unit's serial nameplate", "Final invoice showing any removed or disconnected heating equipment", "Income documents if you apply for the income-qualified tier"],
      amountsNote: "The calculator counts $8,000. Mass Save pays by the ton, so the final amount follows your size and whole-home vs. partial-home."
    },
    minneapolis: {
      intro: "In the Twin Cities the dependable money comes from your electric utility (Xcel Energy) and, if you keep a gas furnace as backup, your gas utility (CenterPoint Energy).",
      programs: [
        { name: "Xcel Energy cold-climate heat pump rebate", level: "Utility", status: "open",
          amount: "$2,000 if you also use Xcel gas or are a combo customer; $1,500 if electric only. Extra $600 if insulation and air sealing come first.",
          note: "Equipment must be on the NEEP cold-climate list (COP 1.75 or better at 5 °F). Central systems need an Xcel participating contractor. Apply by Sept 30 of the year after install.",
          url: "https://www.xcelenergy.com/digital_application", checked: false },
        { name: "CenterPoint Energy ducted heat pump + gas furnace rebate", level: "Utility", status: "open",
          amount: "The team's earlier data said $1,100. CenterPoint's page on 2026-11-07 showed $400 for an existing home; confirm the amount with CenterPoint.",
          note: "For a hybrid with a 92%+ efficient gas furnace. The heat pump must be set to switch to gas at 40 °F or below. Your contractor usually submits it; allow up to 10 weeks.",
          url: "https://www.centerpointenergy.com/en-us/residential/save-energy-money/efficiency-programs-and-rebates/ducted-air-source-heat-pump-rebate?sa=mn", checked: true },
        { name: "Minneapolis Green Cost Share", level: "City", status: "limited", amount: "Up to $14,000, Green Zone homes only",
          note: "Check whether your address is in a Green Zone.", url: "https://homeenergybasics.com/heat-pumps/states/mn", checked: true },
        { name: "Minnesota income-qualified heat pump rebate (HEAR)", level: "State", status: "unclear", amount: "Up to $8,000 for households under 80% of area median income",
          note: "Not launched as of the team's sources.", url: "https://homeenergybasics.com/heat-pumps/states/mn", checked: true }
      ].concat(FED_US),
      paperwork: ["Xcel and CenterPoint account numbers (from a bill)", "Model and serial numbers of the heat pump (from the installer)", "AHRI or NEEP listing for the model", "Final itemized invoice", "Proof the heat pump switchover is set to 40 °F or lower (hybrid with gas)", "Insulation / air-sealing invoice if claiming the $600 bonus", "Income documents for income-qualified programs"],
      amountsNote: "The calculator uses $2,000 for the heat pump and adds $1,100 only if you heat with gas today (from the team's earlier data)."
    },
    fairbanks: {
      intro: "In Fairbanks, rebate money has been scarce. The state's federal home energy rebate program had not launched as of the most recent page we read, so check before counting on any rebate.",
      programs: [
        { name: "Alaska Residential Energy Rebates (HOMES / HEEHR)", level: "State (AHFC)", status: "not open",
          amount: "None available at this time",
          note: "Alaska Housing Finance Corporation says no rebates are available yet except for new construction. Sign up for their updates, and beware of unsolicited offers (scams).",
          url: "https://www.ahfc.us/efficiency/programs-for-homeowners/alaska-residential-energy-rebates", checked: true },
        { name: "Utility and local programs", level: "Utility / local", status: "unclear", amount: "Ask Golden Valley Electric Association, your gas or fuel supplier, and the Fairbanks North Star Borough",
          note: "We have not confirmed an active heat pump rebate from these. A phone call is the quickest check.", url: "", checked: false }
      ].concat(FED_US.slice(0, 1)),
      paperwork: ["Electric utility account number", "Proof of current heating fuel", "Itemized invoice with model and serial number", "Income documents if an income-qualified program opens"],
      amountsNote: "The calculator counts $0 in rebates for Fairbanks because no program is open yet."
    }
  };

  const STATUS = { open: "Open", limited: "Limited", ended: "Ended", unclear: "Check status", "not open": "Not open yet" };

  window.HP_REBATES = { SOURCES, REGION, STATUS, asOf: "2026-11-07" };
})();
