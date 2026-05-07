import CrowdfundingDetails from './crowdfunding-details';
import CrowdfundingSymbolSection from './crowdfunding-symbol-section';

function EquityProject() {
  return <CrowdfundingDetails title="Security Token Crowdfunding Details" />;
}

export default function Equity() {
  return <CrowdfundingSymbolSection CrowdfundingComponent={EquityProject} />;
}
