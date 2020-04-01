import React, { useState, useEffect } from 'react';

import { InsuranceOutlined, MailOutlined, UploadOutlined } from '@ant-design/icons';

import { Upload, Button, Card, Row, Tooltip, Skeleton } from 'antd';

import PropTypes from 'prop-types';

import { getCandidateProfile, removeCandidateDocument } from '@/services/api';

const url = 'https://a.deephire.com/v1/candidates';

const EditableCard = ({ interviewName, email, key, documentProps }) => (
  <>
    {interviewName && (
      <Row>
        <InsuranceOutlined style={{ padding: 4 }} /> {interviewName}
      </Row>
    )}

    {email && (
      <Row>
        <MailOutlined style={{ padding: 4 }} />
        <Tooltip title="Click to email">
          <a target="_blank" rel="noopener noreferrer" href={`mailto:${email}`}>
            {email}
          </a>
        </Tooltip>
      </Row>
    )}

    <Upload key={key} {...documentProps}>
      <Button style={{ marginTop: 24 }}>
        <UploadOutlined /> Add Document
      </Button>
    </Upload>
  </>
);

const ViewCard = ({ key, documentProps }) => <Upload key={key} {...documentProps} />;

const InfoCardEditable = props => {
  const { userName, interviewName, editable, email } = props;
  const [candidateProfileData, setCandidateProfileData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [key, setKey] = useState(1);

  const loadInfo = async () =>
    getCandidateProfile(email).then(r => {
      const candidateProfile = r;
      if (r) {
        if (candidateProfile.files) {
          candidateProfile.files = r.files.map(r => ({
            ...r,
            url: `${url}/${email}/documents/${r.uid}`,
          }));
        }
        setCandidateProfileData(candidateProfile);
      }
    });

  useEffect(() => {
    const initialDataLoad = async () => {
      setLoading(true);
      if (email) {
        await loadInfo();
        setLoading(false);
      }
    };
    initialDataLoad();
  }, [email]);

  useEffect(() => {
    loadInfo();
  }, [key]);

  const documentUploadProps = {
    name: 'upfile',
    action: `${url}/${email}/documents/`,
    headers: { authorization: `Bearer ${localStorage.getItem('access_token')}` },
    onChange({ file }) {
      if (file.status === 'done') {
        setKey(key + 1);
      }
    },
    defaultFileList: candidateProfileData?.files,
    key: candidateProfileData?.files,
    onRemove(file) {
      removeCandidateDocument(email, file.uid);
    },
  };

  const documentViewProps = {
    defaultFileList: candidateProfileData?.files,
    key: candidateProfileData?.files,
  };

  const editProps = { interviewName, email, key, documentProps: documentUploadProps };
  const viewProps = { key, documentProps: documentViewProps };
  return (
    <Card hoverable title={userName} {...props}>
      <Skeleton loading={loading} active>
        {editable ? <EditableCard {...editProps} /> : <ViewCard {...viewProps} />}
      </Skeleton>
    </Card>
  );
};

InfoCardEditable.propTypes = {
  userName: PropTypes.string,
  interviewName: PropTypes.string,
  email: PropTypes.string.isRequired,
  editable: PropTypes.bool,
};

InfoCardEditable.defaultProps = {
  userName: '',
  interviewName: '',
  editable: false,
};

export default InfoCardEditable;
