import Login from '@/components/auth/login';

export default function Page() {
  return (
    <Login
      title="Welcome to InfraFund"
      description={
        <>
          Existing users can login directly.
          <br />
          New users will see our questionnaire first.
        </>
      }
      buttonLabel="Login / Register"
    />
  );
}
