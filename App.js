import {Image, ImageBackground, SafeAreaView, StyleSheet, Text, View, StatusBar, Button, ScrollView, Alert} from 'react-native';
import SelectDropdown from 'react-native-select-dropdown';
import { words, backend } from './constants';
import { useState, useEffect, useRef, useCallback } from 'react';
import { Camera } from 'expo-camera';
import { Video } from 'expo-av'
import YoutubePlayer from "react-native-youtube-iframe"
import LottieView from 'lottie-react-native';

const Loader = () => {
  return (
    <View style={[StyleSheet.absoluteFillObject, styles.loader]}>
      <LottieView source={require('./anime1.json')} autoPlay loop />
    </View>
  )
}

const Correct = () => {
  return (
    <View style={styles.correct}>
      <Text>Correct</Text>
    </View>
  )
}

const Recording = (props) => {
  const [hasCameraPermission, setHasCameraPermission] = useState(null);
  const [hasAudioPermission, setHasAudioPermission] = useState(null);
  const [camera, setCamera] = useState(null);
  const [record, setRecord] = useState(null);
  const [type, setType] = useState(Camera.Constants.Type.front);
  const video = useRef(null);
  const [status, setStatus] = useState({});

  const [waitTime, setWaitTime] = useState(false);
  const [answer, setAnswer] = useState('')

  useEffect(() => {
    (async () => {
      const cameraStatus = await Camera.requestCameraPermissionsAsync();
      setHasCameraPermission(cameraStatus.status === 'granted');

      const audioStatus = await Camera.requestMicrophonePermissionsAsync();
      setHasAudioPermission(audioStatus.status === 'granted');
    })();
  }, []);

  useEffect(()=>{
    setAnswer('');
  }, [props.currWord])

  const takeVideo = async () => {
    if(camera){
        setTimeout( async ()=>{
          try{
            const data = await camera.recordAsync({
              maxDuration:7,
              mute: true,
              quality: "720p",
            })
            setRecord(data.uri);
            console.log(data.uri);
          } catch(err) {
            console.log(err);
          }
        },3000);
    }
  }

  const submitVideo = async () => {
    props.setLoader(true);
    if(record){
      try{
        console.log("working", record)
        const form = new FormData();
        form.append("file", {
          name: "mobileUpload.mp4",
          type: "video/mp4",
          uri: record,
        }, "mobileUpload.mp4");
        
        const response = await fetch(
          backend,
          {
            method: "post",
            body: form,
          }
        );
        const responseJSON = (await response.json());
        setAnswer(responseJSON.result);
      } catch(err) {
        Alert.alert("Unable to Send video!!!");
      }
    }
    props.setLoader(false);
  }

  if (hasCameraPermission === null || hasAudioPermission === null ) {
    return <View />;
  }
  if (hasCameraPermission === false || hasAudioPermission === false) {
    return <Text>No access to camera</Text>;
  }

  return (
    <>
    <View style={{ flex: 1}}>
        <View>
          <View style={styles.cameraContainer}>
              <Camera 
              ref={ref => setCamera(ref)}
              style={styles.fixedRatio} 
              type={type}
              ratio={'4:3'} />
          </View>
          <Button title="Take video" onPress={takeVideo} color='#0704ba'/>
          <Text style={styles.textVideoDetails}>Rrecording will start after 3 sec</Text>
        </View>
        <View>
          <Video
            ref={video}
            style={styles.video}
            source={{
              uri: record,
            }}
            useNativeControls
            resizeMode="cover"
            onPlaybackStatusUpdate={status => setStatus(() => status)}
          />
          <View style={styles.buttons}>
            <Button
              title={status.isPlaying ? 'Pause' : 'Play'}
              onPress={() =>
                status.isPlaying ? video.current.pauseAsync() : video.current.playAsync()
              }
              color='#0704ba'
            />
          </View>
        </View>
        <View>
          <View>
            {(answer!='')?<Text style={[styles.textVideoDetails, {backgroundColor:(answer.toUpperCase()==props.currWord.toUpperCase())?'green':'red'} ]}>{(answer.toUpperCase()==props.currWord.toUpperCase())?'Correct':"Incorrect"} Gesture: {answer.toUpperCase()}</Text>:null}
            {(record)?<Button title={"Submit"} onPress={()=>{submitVideo();}}/>:null}
          </View>
        </View>
    </View>
    </>
  );
}

const Iframe = (props) => {
  const [word, setWord] = useState(props.currWord);
  const [playing, setPlaying] = useState(false);

  const onStateChange = useCallback((state) => {
    if (state === "ended") {
      setPlaying(false);
    }
  }, []);

  const togglePlaying = useCallback(() => {
    setPlaying((prev) => !prev);
  }, []);
  
  return (
    <View>
      <YoutubePlayer
        height={300}
        play={playing}
        videoId={props.currId}
        onChangeState={onStateChange}
      />
    </View>
  );
}

const App = () => {

  const wordArray = [];
  const mode = ['learn', 'practice']
  const defaultVideoId = "r9gCipM-wn0"

  const [loading, setLoading] = useState(false);

  for(let key in words){
    wordArray.push(key);
  }

  const [currentWord, setWord] = useState(wordArray[0]);
  const [currentMode, setMode] = useState(mode[0]);

  return (
    <SafeAreaView style={styles.container}>
      <View style={{alignItems: 'center', backgroundColor: "#0704ba"}}>
        <Image source={require("./assets/sign-mate-logo.png")} style={styles.logo}/>
      </View>
      <ImageBackground source={require("./assets/bg_img.png")} resizeMode="cover" style={styles.image}>
        <View style={{flexDirection: 'row', padding: 25}}>
          <View style={{flex: 1, paddingRight: 10}}>
            <SelectDropdown
              data={wordArray}
              onSelect={(selectedItem, index) => {
                setWord(selectedItem);
              }}
              buttonStyle={{
                borderRadius: 10,
                borderBottomColor: 'black',
                height: 40,
                width: 170
              }}
              defaultValue={currentWord}
            />
          </View>
          <View style={{flex: 1, paddingLeft: 10}}>
            <SelectDropdown
              data={mode}
              onSelect={(selectedItem, index) => {
                setMode(selectedItem);
              }}
              buttonStyle={{
                borderRadius: 10,
                borderBottomColor: 'black',
                height: 40,
                width: 170
              }}
              defaultValue={currentMode}
            />
          </View>
        </View>
        <Text style={styles.text}>{currentWord}</Text>
        <ScrollView>
          {
            (currentMode == "learn")? <Iframe currId={words[currentWord].videoId?words[currentWord].videoId:defaultVideoId} />: <Recording setLoader={setLoading} currWord={currentWord} />
          }
        </ScrollView>
      </ImageBackground>
      {loading?<Loader/>:null}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    marginTop: StatusBar.currentHeight,
  },
  image: {
    flex: 1,
  },
  text: {
    color: 'white',
    fontSize: 42,
    lineHeight: 84,
    fontWeight: 'bold',
    textAlign: 'center',
    backgroundColor: '#000000c0',
    marginBottom: 20,
  },
  textVideoDetails: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    paddingTop: 20,
    paddingBottom: 20
  },
  topBar: {
    backgroundColor: "#0704ba",
    flex:1,
    flexDirection: 'row',
    alignContent: 'center',
    justifyContent: 'center'
  },
  logo: {
    height: 80,
    width: 80,
  },
  cameraContainer: {
    flex: 1,
    flexDirection: 'row',
  },
  fixedRatio:{
      flex: 1,
      aspectRatio: 1
  },
  video: {
    alignSelf: 'center',
    width: 300,
    height: 480,
    margin: 10,
  },
  buttons: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    margin: 10,
  },
  loader: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.3)',
    zIndex: 1,
  },
  correct: {
    color:'green'
  }
});

export default App;