import CrowdfundingDetails from './crowdfunding-details';
import CrowdfundingSymbolSection from './crowdfunding-symbol-section';

function CharityCrowdfunding() {
  return <CrowdfundingDetails title="Charity-Base Crowdfunding Details" />;
}

export default function Charity() {
  return (
    <CrowdfundingSymbolSection CrowdfundingComponent={CharityCrowdfunding} />
  );
}
