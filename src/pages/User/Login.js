import Login from '@/components/Login';
import { sendEmail, resetPassword } from '@/services/api';
import { Alert, Button, Form, Input } from 'antd';
import { connect } from 'dva';
import React, { Component, useState } from 'react';
import Auth from '../../Auth/Auth';
import styles from './Login.less';

const FormItem = Form.Item;

const { Tab, UserName, Password, Submit } = Login;

const auth = new Auth();

const ForgotPassScreen = Form.create()(props => {
  const { setForgotPass, form } = props;
  const [resetRequested, setResetRequested] = useState(false);

  const returnToLoginButton = (
    <Button style={{ float: 'right' }} onClick={() => setForgotPass(false)} type="link">
      Return to Log In
    </Button>
  );
  const submitResetPassword = event => {
    event.preventDefault();

    form.validateFields((err, fieldsValue) => {
      if (err) return;
      form.resetFields();
      setResetRequested(true);
      resetPassword(fieldsValue.email);
    });
  };
  return (
    <div>
      {resetRequested ? (
        <Alert
          style={{ marginBottom: 20 }}
          message="Recovery email sent. Check your mail inbox."
          type="success"
        />
      ) : (
        <div style={{ paddingBottom: 20, textAlign: 'center' }}>
          {`Enter your email below and we'll send you a link to reset your password.`}
        </div>
      )}
      <Form onSubmit={submitResetPassword}>
        <FormItem>
          {form.getFieldDecorator('email', {
            rules: [
              { type: 'email', message: 'The input is not valid E-mail!' },
              {
                required: true,
                message: 'Please input your email address!',
              },
            ],
          })(<Input placeholder="Email Address" />)}
        </FormItem>
        {/* <UserName name="email"   placeholder="email" /> */}
        <Button style={{ width: '100%' }} type="primary" onClick={submitResetPassword}>
          Send Reset Link
        </Button>
      </Form>
      {returnToLoginButton}
    </div>
  );
});
@connect(({ loading }) => ({
  submitting: loading.effects['login/login'],
}))
class LoginPage extends Component {
  state = {
    type: 'account',
    forgotPassword: false,
  };

  onTabChange = type => {
    this.setState({ type });
  };

  setForgotPass(forgot) {
    this.setState({ forgotPassword: forgot });
  }

  handleSubmit = (err, values) => {
    if (values.email !== 'demo@deephire.com') {
      sendEmail({
        recipients: ['russell@deephire.com'],
        subject: `${values.email} tried to login`,
        message: values.email,
      });
    }
    this.loginForm.validateFields((err, values) => {
      if (!err) {
        const { type } = this.state;

        if (type === 'account') {
          auth.login(values.email, values.password);
        } else {
          auth.signup(values.email, values.password);
        }
      }
    });
  };

  renderMessage = content => (
    <Alert style={{ marginBottom: 24 }} message={content} type="error" showIcon />
  );

  render() {
    const { submitting } = this.props;
    const { type, forgotPassword } = this.state;
    return (
      <div className={styles.main}>
        {!forgotPassword ? (
          <Login
            defaultActiveKey={type}
            onTabChange={this.onTabChange}
            onSubmit={this.handleSubmit}
            ref={form => {
              this.loginForm = form;
            }}
          >
            <Tab key="account" tab="Log In">
              <UserName name="email" placeholder="email" />
              <Password
                name="password"
                placeholder="password"
                onPressEnter={() => this.loginForm.validateFields(this.handleSubmit)}
              />
              <Button
                style={{ float: 'right' }}
                onClick={() => this.setForgotPass(true)}
                type="link"
              >
                Forgot Password
              </Button>
            </Tab>
            <Tab key="signUp" tab="Sign Up">
              <UserName name="email" placeholder="email" />
              <Password
                name="password"
                placeholder="password"
                onPressEnter={() => this.loginForm.validateFields(this.handleSubmit)}
              />
            </Tab>

            <Submit loading={submitting}>{type === 'account' ? 'Log in' : 'Sign up'}</Submit>
            <div className={styles.other}>
              {type === 'account' ? 'Or Login With' : 'Or Signup With'}
              <Button
                onClick={auth.loginWithGoogle}
                shape="circle"
                size="large"
                icon="google"
                style={{ marginLeft: 16 }}
              />
              <Button
                onClick={auth.loginWithLinkedin}
                shape="circle"
                size="large"
                icon="linkedin"
                style={{ marginLeft: 16 }}
              />
              <Button
                onClick={auth.loginWithFacebook}
                shape="circle"
                size="large"
                icon="facebook"
                style={{ marginLeft: 16 }}
              />
            </div>
          </Login>
        ) : (
          <ForgotPassScreen setForgotPass={() => this.setForgotPass()} />
        )}
      </div>
    );
  }
}

export default LoginPage;
