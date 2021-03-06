import "./SignUp.page.scss";

import * as React from "react";
import { SignInControl, Modal, Button, DisplayError, Form, Input, Message, LegalAgreement } from "@fider/components";
import { SystemSettings } from "@fider/models";
import { jwt, page, actions, Failure } from "@fider/services";

const logo = require("@fider/assets/images/logo-small.png");

interface OAuthUser {
  token: string;
  name: string;
  email: string;
}

interface SignUpPageProps {
  system: SystemSettings;
}

interface SignUpPageState {
  submitted: boolean;
  tenantName: string;
  legalAgreement: boolean;
  error?: Failure;
  name?: string;
  email?: string;
  subdomain: {
    available: boolean;
    message?: string;
    value?: string;
  };
}

export class SignUpPage extends React.Component<SignUpPageProps, SignUpPageState> {
  private user?: OAuthUser;

  constructor(props: SignUpPageProps) {
    super(props);
    this.state = {
      submitted: false,
      legalAgreement: false,
      tenantName: "",
      subdomain: { available: false }
    };

    const token = page.getQueryString("token");
    if (token) {
      const data = jwt.decode(token);
      if (data) {
        this.user = {
          token,
          name: data["oauth/name"],
          email: data["oauth/email"]
        };
      }
    }
  }

  private confirm = async () => {
    const result = await actions.createTenant({
      token: this.user && this.user.token,
      legalAgreement: this.state.legalAgreement,
      tenantName: this.state.tenantName,
      subdomain: this.state.subdomain.value,
      name: this.state.name,
      email: this.state.email
    });

    if (result.ok) {
      if (result.data.token) {
        if (page.isSingleHostMode()) {
          location.reload();
        } else {
          let baseUrl = `${location.protocol}//${this.state.subdomain.value}${this.props.system.domain}`;
          if (location.port) {
            baseUrl = `${baseUrl}:${location.port}`;
          }

          location.href = `${baseUrl}?token=${result.data.token}`;
        }
      } else {
        this.setState({ submitted: true });
      }
    } else if (result.error) {
      this.setState({ error: result.error, submitted: false });
    }
  };

  private checkAvailability = async (subdomain: string) => {
    const result = await actions.checkAvailability(subdomain);

    this.setState({
      subdomain: {
        value: subdomain,
        available: !result.data.message,
        message: result.data.message
      }
    });
  };

  private onAgree = (agreed: boolean): void => {
    this.setState({ legalAgreement: agreed });
  };

  private setName = (name: string): void => {
    this.setState({ name });
  };

  private setEmail = (email: string): void => {
    this.setState({ email });
  };

  private setTenantName = (tenantName: string): void => {
    this.setState({ tenantName });
  };

  public render() {
    const modal = (
      <Modal.Window canClose={false} isOpen={this.state.submitted}>
        <Modal.Header>Thank you for registering!</Modal.Header>
        <Modal.Content>
          <p>
            We have just sent a confirmation link to <b>{this.state.email}</b>. <br /> Click the link to finish your
            registration.
          </p>
        </Modal.Content>
      </Modal.Window>
    );

    return (
      <div id="p-signup" className="page container">
        {modal}
        <img className="logo" src={logo} />

        <h3>1. Who are you?</h3>
        <DisplayError fields={["token"]} error={this.state.error} />

        {this.user ? (
          <p>
            Hello, <b>{this.user.name}</b> {this.user.email && `(${this.user.email})`}
          </p>
        ) : (
          <>
            <p>We need to identify you to setup your new Fider account.</p>
            <SignInControl useEmail={false} />
            <Form error={this.state.error}>
              <Input field="name" maxLength={100} onChange={this.setName} placeholder="Name" />
              <Input field="email" maxLength={200} onChange={this.setEmail} placeholder="Email" />
            </Form>
          </>
        )}

        <h3>2. What is this Feedback Forum for?</h3>

        <Form error={this.state.error}>
          <Input
            field="tenantName"
            maxLength={60}
            onChange={this.setTenantName}
            placeholder="your company or product name"
          />
          {!page.isSingleHostMode() && (
            <Input
              field="subdomain"
              maxLength={40}
              onChange={this.checkAvailability}
              placeholder="subdomain"
              suffix={this.props.system.domain}
            >
              {this.state.subdomain.available && <Message type="success">This subdomain is available!</Message>}
              {this.state.subdomain.message && <Message type="error">{this.state.subdomain.message}</Message>}
            </Input>
          )}
        </Form>

        <h3>3. Review</h3>

        <p>Make sure information provided above is correct.</p>

        <Form error={this.state.error}>
          <LegalAgreement onChange={this.onAgree} />
        </Form>

        <Button color="positive" size="large" onClick={this.confirm}>
          Confirm
        </Button>
      </div>
    );
  }
}
