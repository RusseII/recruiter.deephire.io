import React, { Component } from 'react';
import ReactPlayer from 'react-player';

import { Card, Col, Row, Icon, Table, Button, Modal, Input, Checkbox, Form, message } from 'antd';
import router from 'umi/router';
import Result from '@/components/Result';
import InfoCardEditable from '@/components/InfoCardEditable';
import { CopyToClipboard } from 'react-copy-to-clipboard';

import { connect } from 'dva';
import styles from './ViewCandidate.less';

const FormItem = Form.Item;

const columns = [
  {
    title: 'Questions',
    dataIndex: 'question_text',
    key: 'question_text',
  },
];

const GetURLParameter = sParam => {
  const sPageURL = window.location.search.substring(1);
  const sURLVariables = sPageURL.split('&');
  for (let i = 0; i < sURLVariables.length; i += 1) {
    const sParameterName = sURLVariables[i].split('=');
    if (sParameterName[0] === sParam) {
      return sParameterName[1];
    }
  }
  return null;
};

const CleanVariable = res => {
  if (res === undefined) return null;
  const no20 = res.replace(/%20/g, ' ');
  const response = no20.replace(/%40/g, '@');
  return response;
};

@connect(({ rule, user }) => ({
  currentUser: user.currentUser,
  rule,
}))
@Form.create()
class App extends Component {
  constructor(props) {
    super(props);

    this.state = {
      activeQuestion: null,
      modalVisible: false,
      currentStep: 1,
    };
  }

  componentDidMount() {
    const id = CleanVariable(GetURLParameter('id'));
    const userToken = CleanVariable(GetURLParameter('candidate'));
    this.setState({ id, userToken });
    // var url = "https://localhost:3001/v1.0/get_candidate_videos/";
    const url = 'https://api.deephire.com/v1.0/get_candidate_videos/';

    fetch(`${url + id}/${userToken}`)
      .then(results => results.json())
      .then(
        data => {
          this.setState({
            candidateData: data,
            activeQuestion: 0,
            videoUrl: data[0].response_url,
            currentQuestionText: data[0].question_text,
          });
        },
        () => {
          this.setState({
            requestFailed: true,
          });
        }
      );
  }

  getName() {
    const { candidateData } = this.state;
    return candidateData[0].user_name;
  }

  openInterview = () => {
    const { userToken, id } = this.state;
    const url = `https://candidates.deephire.com/?id=${id}&candidate=${userToken}`;

    window.open(url, '_blank');
  };

  nextQuestion = () => {
    const { activeQuestion, candidateData } = this.state;

    if (activeQuestion + 1 < candidateData.length) {
      const videoUrl = candidateData[activeQuestion + 1].response_url;
      const questionText = candidateData[activeQuestion + 1].question_text;
      this.setVideoData(videoUrl, questionText);

      this.setState({ activeQuestion: activeQuestion + 1 });
    }
  };

  setVideoData = (videoUrl, currentQuestionText) => {
    this.setState({ videoUrl, currentQuestionText });
  };

  previousQuestion = () => {
    const { activeQuestion, candidateData } = this.state;
    if (activeQuestion > 0) {
      const videoUrl = candidateData[activeQuestion - 1].response_url;
      const questionText = candidateData[activeQuestion - 1].question_text;
      this.setVideoData(videoUrl, questionText);
      this.setState({ activeQuestion: activeQuestion - 1 });
    }
  };

  renderContent = currentStep => {
    const {
      rule: { shareLink },
      form,
    } = this.props;
    const { shareEmail, modalVisible } = this.state;

    if (currentStep === 1) {
      return (
        <Modal
          destroyOnClose
          title="Create Shareable Link"
          visible={modalVisible}
          onOk={this.createLinkButton}
          okText="Create Link"
          onCancel={() => this.handleModalVisible()}
        >
          <FormItem labelCol={{ span: 5 }} wrapperCol={{ span: 15 }} label="Name">
            {form.getFieldDecorator('name', {})(<Input placeholder="Their name" />)}
          </FormItem>

          <FormItem labelCol={{ span: 5 }} wrapperCol={{ span: 15 }} label="Email">
            {form.getFieldDecorator('email', {})(
              <Input placeholder="Who do you want to share this with?" />
            )}
          </FormItem>
          <Row gutter={0}>
            <Col span={5} />
            <Col span={15}>
              {' '}
              <Checkbox onChange={this.onCheckHideInfo}>Hide Candidate Info</Checkbox>
            </Col>
          </Row>
        </Modal>
      );
    }
    if (currentStep === 2) {
      return (
        <Modal
          destroyOnClose
          title="Create Shareable Link"
          visible={modalVisible}
          onOk={() => this.handleDone()}
          okText="Done"
          onCancel={() => this.handleDone()}
        >
          <Result
            type="success"
            title="Share Link Created!"
            description={`Send this link to ${shareEmail}`}
            extra={this.information(shareLink, 'russell@deephire.com')}
            className={styles.result}
            extraStyle={{ textAlign: 'center', padding: '5px', fontSize: '15px' }}
          />
        </Modal>
      );
    }
    return null;
  };

  information = shareLink => (
    <div>
      <Row>
        <Col xs={24} sm={24}>
          {`${shareLink}     `}
          <CopyToClipboard text={shareLink}>
            <Button size="small" icon="copy" />
          </CopyToClipboard>
        </Col>
      </Row>
      <br />
    </div>
  );

  onCheckHideInfo = e => {
    this.setState({ hideInfo: e.target.checked });
  };

  success = () => {
    message.success('Link Created!');
  };

  handleModalVisible = flag => {
    this.setState({
      modalVisible: !!flag,
      hideInfo: false,
    });
  };

  createLinkButton = () => {
    const { form, currentUser } = this.props;
    const { email: recruiterEmail } = currentUser;
    const { candidateData, currentStep, hideInfo } = this.state;
    form.validateFields((err, data) => {
      if (err) return;
      let { email } = data;
      form.resetFields();
      if (!email) email = 'noEmailEntered';
      const shortList = { hideInfo, email, created_by: recruiterEmail, interviews: candidateData };
      this.createLink(shortList);
      this.setState({ shareEmail: email, currentStep: currentStep + 1 });
    });
  };

  handleDone = () => {
    this.setState({ currentStep: 1 });
    this.handleModalVisible();
  };

  goToCandidates = () => {
    router.push(`/candidates/candidates`);
  };

  createLink(shortListJson) {
    const { dispatch } = this.props;
    dispatch({ type: 'rule/share', payload: shortListJson });
    this.setState({ hideInfo: false });
    this.success();
  }

  render() {
    const {
      candidateData,
      comments,
      activeQuestion,
      requestFailed,
      currentStep,
      videoUrl,
      currentQuestionText,
    } = this.state;
    if (!candidateData) return <p>Loading...</p>;
    if (comments === null) return <p> Loading! </p>;
    if (activeQuestion === null) return <p> Loading questions... </p>;
    if (requestFailed) return <p>Failed!</p>;
    if (candidateData.length === 0) {
      return <p>There is no data for this user, please message our support</p>;
    }

    const {
      candidate_email: candidateEmail,
      interview_name: interviewName,
      user_name: userName,
    } = candidateData[0];
    // console.log(ReactPlayer.canPlay(response_url));

    return (
      <div>
        {this.renderContent(currentStep)}

        <Button style={{ marginBottom: '20px' }} onClick={this.goToCandidates} type="secondary">
          <Icon type="left" />
          Back to Candidates
        </Button>
        <Button
          style={{ float: 'right', marginBottom: '20px' }}
          onClick={this.handleModalVisible}
          type="primary"
        >
          Share Candidate
          <Icon type="share-alt" />
        </Button>
        <Row gutter={24}>
          <Col span={8}>
            <InfoCardEditable
              userName={userName}
              interviewName={interviewName}
              email={candidateEmail}
              setVideoData={this.setVideoData}
            />

            <Card hoverable title="Questions">
              <Table
                showHeader={false}
                onRow={(record, index) => ({
                  onClick: () => {
                    const url = candidateData[index].response_url;
                    const text = candidateData[index].question_text;
                    this.setVideoData(url, text);
                    this.setState({ activeQuestion: index });
                  },
                })}
                rowClassName={(record, index) => (index === activeQuestion ? styles.selected : '')}
                pagination={false}
                bordered
                dataSource={candidateData}
                columns={columns}
              />
            </Card>
          </Col>
          <Col span={16}>
            <Card
              title={currentQuestionText}
              actions={[
                <Button shape="circle" icon="left" onClick={this.previousQuestion} />,
                <Button onClick={this.nextQuestion} shape="circle" icon="right" />,
              ]}
            >
              <div className={styles.playerWrapper}>
                <ReactPlayer
                  youtubeConfig={{ playerVars: { rel: false, modestbranding: true } }}
                  preload
                  controls
                  playing
                  className={styles.reactPlayer}
                  height="100%"
                  width="100%"
                  url={videoUrl}
                />
              </div>
            </Card>
          </Col>
        </Row>
      </div>
    );
  }
}

export default App;
